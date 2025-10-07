import {
    CancellationToken,
    ExecuteCommandParams,
    InitializeParams,
    LSPErrorCodes,
    ResponseError,
    Server,
} from '@aws/language-server-runtimes/server-interface'
import { performance } from 'perf_hooks'
import { pathToFileURL } from 'url'
import { ArtifactMap } from '../../client/token/codewhispererbearertokenclient'
import { DependencyGraphFactory } from './dependencyGraph/dependencyGraphFactory'
import { getSupportedLanguageId, supportedSecurityScanLanguages } from '../../shared/languageDetection'
import SecurityScanDiagnosticsProvider from './securityScanDiagnosticsProvider'
import { SecurityScanCancelledError, SecurityScanHandler } from './securityScanHandler'
import { SecurityScanRequestParams, SecurityScanResponse } from './types'
import { SecurityScanEvent } from '../../shared/telemetry/types'
import { getErrorMessage, parseJson } from '../../shared/utils'
import { v4 as uuidv4 } from 'uuid'
import { AmazonQTokenServiceManager } from '../../shared/amazonQServiceManager/AmazonQTokenServiceManager'
import { hasConnectionExpired } from '../../shared/utils'
import { AmazonQServiceConnectionExpiredError } from '../../shared/amazonQServiceManager/errors'

const RunSecurityScanCommand = 'aws/codewhisperer/runSecurityScan'
const CancelSecurityScanCommand = 'aws/codewhisperer/cancelSecurityScan'

export const SecurityScanServerToken =
    (): Server =>
    ({ credentialsProvider, workspace, logging, lsp, telemetry, runtime, sdkInitializator }) => {
        let amazonQServiceManager: AmazonQTokenServiceManager
        let scanHandler: SecurityScanHandler

        const diagnosticsProvider = new SecurityScanDiagnosticsProvider(lsp, logging)

        const runSecurityScan = async (params: SecurityScanRequestParams, token: CancellationToken) => {
            /**
             * Only project scans are supported at this time
             */
            logging.log(`Starting security scan`)
            await diagnosticsProvider.resetDiagnostics()
            let jobStatus: string
            const securityScanStartTime = performance.now()
            let serviceInvocationStartTime = 0
            const securityScanTelemetryEntry: Partial<SecurityScanEvent> = {
                codewhispererCodeScanSrcPayloadBytes: 0,
                codewhispererCodeScanSrcZipFileBytes: 0,
                codewhispererCodeScanLines: 0,
                duration: 0,
                contextTruncationDuration: 0,
                artifactsUploadDuration: 0,
                codeScanServiceInvocationsDuration: 0,
                result: 'Succeeded',
                codewhispererCodeScanTotalIssues: 0,
                codewhispererCodeScanIssuesWithFixes: 0,
                credentialStartUrl: credentialsProvider.getConnectionMetadata?.()?.sso?.startUrl ?? undefined,
            }
            try {
                if (!credentialsProvider.hasCredentials('bearer')) {
                    throw new Error('Credentials provider does not have bearer token credentials')
                }

                logging.log(`Parameters provided: ${JSON.stringify(params)}`)

                if (!params.arguments || params.arguments.length === 0) {
                    throw new Error(`Error: Invalid data.`)
                }
                const [arg] = params.arguments

                logging.log(`Arguments provided: ${JSON.stringify(arg)}`)

                const { ActiveFilePath: activeFilePath, ProjectPath: projectPath } = parseJson(arg)
                if (!activeFilePath) {
                    throw new Error('Error: File to scan is missing.')
                }

                if (!projectPath) {
                    throw new Error('Error: Project is missing.')
                }
                const activeFilePathUri = pathToFileURL(activeFilePath).href
                const document = await workspace.getTextDocument(activeFilePathUri)
                securityScanTelemetryEntry.codewhispererLanguage = getSupportedLanguageId(document)
                if (!document) {
                    throw new Error('Error: Text document for given file is missing.')
                }
                /**
                 * Step 1: Generate context truncations
                 */
                const dependencyGraph = DependencyGraphFactory.getDependencyGraph(
                    document,
                    workspace,
                    logging,
                    projectPath
                )
                if (dependencyGraph === undefined) {
                    throw new Error(`"${document.languageId}" is not supported for security scan.`)
                }
                if (dependencyGraph.exceedsSizeLimit((await workspace.fs.getFileSize(activeFilePath)).size)) {
                    throw new Error(
                        `Error: Selected file larger than ${dependencyGraph.getReadableSizeLimit()}. Try a different file.`
                    )
                }
                const contextTruncationStartTime = performance.now()
                const truncation = await dependencyGraph.generateTruncation(activeFilePath)
                securityScanTelemetryEntry.contextTruncationDuration = performance.now() - contextTruncationStartTime
                securityScanTelemetryEntry.codewhispererCodeScanSrcPayloadBytes = truncation.srcPayloadSizeInBytes
                securityScanTelemetryEntry.codewhispererCodeScanBuildPayloadBytes = truncation.buildPayloadSizeInBytes
                securityScanTelemetryEntry.codewhispererCodeScanSrcZipFileBytes = truncation.zipFileSizeInBytes
                securityScanTelemetryEntry.codewhispererCodeScanLines = truncation.lines
                scanHandler.throwIfCancelled(token)

                logging.log(`Complete project context processing.`)

                /**
                 * Step 2: Get presigned Url, upload and clean up
                 */
                const uploadStartTime = performance.now()
                let artifactMap: ArtifactMap = {}
                const scanName = uuidv4()
                try {
                    artifactMap = await scanHandler.createCodeResourcePresignedUrlHandler(
                        truncation.zipFileBuffer,
                        scanName
                    )
                } catch (error) {
                    logging.log(`Error: Failed to upload code artifacts ${error}`)
                    throw error
                } finally {
                    await dependencyGraph.removeTmpFiles()
                    securityScanTelemetryEntry.artifactsUploadDuration = performance.now() - uploadStartTime
                }
                scanHandler.throwIfCancelled(token)
                /**
                 * Step 3:  Create scan job
                 */
                serviceInvocationStartTime = performance.now()
                const scanJob = await scanHandler.createScanJob(
                    artifactMap,
                    document.languageId.toLowerCase(),
                    scanName
                )
                logging.log(`Created security scan job id: ${scanJob.jobId}`)
                securityScanTelemetryEntry.codewhispererCodeScanJobId = scanJob.jobId
                scanHandler.throwIfCancelled(token)

                /**
                 * Step 4:  Polling mechanism on scan job status
                 */
                jobStatus = await scanHandler.pollScanJobStatus(scanJob.jobId)
                if (jobStatus === 'Failed') {
                    throw new Error('Error: Security scan job failed.')
                }
                scanHandler.throwIfCancelled(token)

                /**
                 * Step 5: Process and render scan results
                 */
                logging.log(`Security scan job succeeded and start processing result.`)
                const securityRecommendationCollection = await scanHandler.listScanResults(scanJob.jobId, projectPath)
                const { total, withFixes } = securityRecommendationCollection.reduce(
                    (accumulator, current) => ({
                        total: accumulator.total + current.issues.length,
                        withFixes:
                            accumulator.withFixes + current.issues.filter(i => i.suggestedFixes.length > 0).length,
                    }),
                    { total: 0, withFixes: 0 }
                )
                logging.log(`Security scan found ${total} issues, ${withFixes} have suggested fixes.`)
                securityScanTelemetryEntry.codewhispererCodeScanTotalIssues = total
                securityScanTelemetryEntry.codewhispererCodeScanIssuesWithFixes = withFixes
                scanHandler.throwIfCancelled(token)

                /**
                 * Step 6: send results to diagnostics
                 */
                await diagnosticsProvider.createDiagnostics(securityRecommendationCollection)

                logging.log(`Security scan completed.`)
                truncation.scannedFiles.forEach(file => logging.log(`Scanned file: ${file}`))

                return {
                    status: 'Succeeded',
                    findings: {
                        totalFindings: total,
                        findingsWithFixes: withFixes,
                        scannedFiles: Array.from(truncation.scannedFiles.values()).join(','),
                    },
                } as SecurityScanResponse
            } catch (error) {
                if (error instanceof SecurityScanCancelledError) {
                    logging.log(`Security scan has been cancelled. ${error}`)
                    securityScanTelemetryEntry.result = 'Cancelled'
                    return {
                        status: 'Cancelled',
                    } as SecurityScanResponse
                }
                logging.log(`Security scan failed. ${error}`)
                securityScanTelemetryEntry.result = 'Failed'
                const errMessage = getErrorMessage(error)
                const exception = hasConnectionExpired(error)
                    ? new AmazonQServiceConnectionExpiredError(errMessage)
                    : error

                return {
                    status: 'Failed',
                    errorMessage: errMessage,
                    exception: exception,
                } as SecurityScanResponse
            } finally {
                securityScanTelemetryEntry.duration = performance.now() - securityScanStartTime
                securityScanTelemetryEntry.codeScanServiceInvocationsDuration =
                    performance.now() - serviceInvocationStartTime
                telemetry.emitMetric({
                    name: 'codewhisperer_securityScan',
                    result: securityScanTelemetryEntry.result,
                    data: securityScanTelemetryEntry,
                })
            }
        }

        const onExecuteCommandHandler = async (
            params: ExecuteCommandParams,
            _token: CancellationToken
        ): Promise<any> => {
            logging.log(params.command)
            switch (params.command) {
                case RunSecurityScanCommand:
                    return runSecurityScan(params as SecurityScanRequestParams, scanHandler.tokenSource.token)
                case CancelSecurityScanCommand:
                    scanHandler.cancelSecurityScan()
            }
            return
        }
        const onInitializeHandler = (params: InitializeParams) => {
            return {
                capabilities: {
                    executeCommandProvider: {
                        commands: [RunSecurityScanCommand, CancelSecurityScanCommand],
                    },
                },
            }
        }

        const onInitializedHandler = async () => {
            amazonQServiceManager = AmazonQTokenServiceManager.getInstance()

            scanHandler = new SecurityScanHandler(amazonQServiceManager, workspace, logging)
        }

        lsp.onExecuteCommand(onExecuteCommandHandler)
        lsp.addInitializer(onInitializeHandler)
        lsp.onInitialized(onInitializedHandler)
        lsp.onDidChangeTextDocument(async p => {
            const textDocument = await workspace.getTextDocument(p.textDocument.uri)
            const languageId = getSupportedLanguageId(textDocument, supportedSecurityScanLanguages)

            if (!textDocument || !languageId) {
                return
            }

            p.contentChanges.forEach(async change => {
                await diagnosticsProvider.validateDiagnostics(p.textDocument.uri, change)
            })
        })

        lsp.workspace.onDidChangeWorkspaceFolders(async event => {
            // clear security scan diagnostics for previous run when a workspace change event occurs
            await diagnosticsProvider.resetDiagnostics()
        })

        logging.log('SecurityScan server has been initialized')

        return () => {
            // dispose function
            scanHandler?.tokenSource.dispose()
        }
    }
