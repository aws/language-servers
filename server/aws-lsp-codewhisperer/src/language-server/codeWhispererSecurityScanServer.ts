import {
    CancellationToken,
    CredentialsProvider,
    ExecuteCommandParams,
    Server,
} from '@aws/language-server-runtimes/server-interface'
import { pathToFileURL } from 'url'
import { ArtifactMap } from '../client/token/codewhispererbearertokenclient'
import { CodeWhispererServiceToken } from './codeWhispererService'
import { DependencyGraphFactory } from './dependencyGraph/dependencyGraphFactory'
import { getSupportedLanguageId, supportedSecurityScanLanguages } from './languageDetection'
import SecurityScanDiagnosticsProvider from './securityScan/securityScanDiagnosticsProvider'
import { SecurityScanCancelledError, SecurityScanHandler } from './securityScan/securityScanHandler'
import { SecurityScanRequestParams, SecurityScanResponse } from './securityScan/types'
import { SecurityScanEvent } from './telemetry/types'
import { getErrorMessage, parseJson } from './utils'

export const SecurityScanServerToken =
    (service: (credentialsProvider: CredentialsProvider) => CodeWhispererServiceToken): Server =>
    ({ credentialsProvider, workspace, logging, lsp, telemetry }) => {
        const codewhispererclient = service(credentialsProvider)
        const diagnosticsProvider = new SecurityScanDiagnosticsProvider(lsp, logging)
        const scanHandler = new SecurityScanHandler(codewhispererclient, workspace, logging)

        const runSecurityScan = async (params: SecurityScanRequestParams, token: CancellationToken) => {
            logging.log(`Starting security scan`)
            diagnosticsProvider.resetDiagnostics()
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
                credentialStartUrl: credentialsProvider.getConnectionMetadata()?.sso?.startUrl ?? undefined,
            }
            try {
                if (!credentialsProvider.hasCredentials('bearer')) {
                    throw new Error('credentialsProvider does not have bearer token credentials')
                }
                if (!params.arguments || params.arguments.length === 0) {
                    throw new Error(`Incorrect params provided. Params: ${params}`)
                }
                const [arg] = params.arguments
                const { ActiveFilePath: activeFilePath, ProjectPath: projectPath } = parseJson(arg)
                if (!activeFilePath || !projectPath) {
                    throw new Error(`Error: file path or project path not provided. Params: ${params}`)
                }
                const activeFilePathUri = pathToFileURL(activeFilePath).href
                const document = await workspace.getTextDocument(activeFilePathUri)
                securityScanTelemetryEntry.codewhispererLanguage = getSupportedLanguageId(document)
                if (!document) {
                    throw new Error('Text document for given activeFilePath is undefined.')
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
                        `Selected file larger than ${dependencyGraph.getReadableSizeLimit()}. Try a different file.`
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
                try {
                    artifactMap = await scanHandler.createCodeResourcePresignedUrlHandler(truncation.zipFileBuffer)
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
                const scanJob = await scanHandler.createScanJob(artifactMap, document.languageId.toLowerCase())
                logging.log(`Created security scan job id: ${scanJob.jobId}`)
                securityScanTelemetryEntry.codewhispererCodeScanJobId = scanJob.jobId
                scanHandler.throwIfCancelled(token)

                /**
                 * Step 4:  Polling mechanism on scan job status
                 */
                jobStatus = await scanHandler.pollScanJobStatus(scanJob.jobId)
                if (jobStatus === 'Failed') {
                    throw new Error('security scan job failed.')
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
                const err = getErrorMessage(error)
                return {
                    status: 'Failed',
                    error: err,
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
                case 'aws/codewhisperer/runSecurityScan':
                    return runSecurityScan(params as SecurityScanRequestParams, scanHandler.tokenSource.token)
                case 'aws/codewhisperer/cancelSecurityScan':
                    scanHandler.cancelSecurityScan()
            }
            return
        }
        diagnosticsProvider.handleHover()
        lsp.onExecuteCommand(onExecuteCommandHandler)
        lsp.onDidChangeTextDocument(async p => {
            const textDocument = await workspace.getTextDocument(p.textDocument.uri)
            const languageId = getSupportedLanguageId(textDocument)

            if (!textDocument || !languageId || !supportedSecurityScanLanguages.includes(languageId)) {
                return
            }

            p.contentChanges.forEach(async change => {
                await diagnosticsProvider.validateDiagnostics(p.textDocument.uri, change)
            })
        })
        logging.log('SecurityScan server has been initialized')

        return () => {
            // dispose function
            scanHandler.tokenSource.dispose()
        }
    }
