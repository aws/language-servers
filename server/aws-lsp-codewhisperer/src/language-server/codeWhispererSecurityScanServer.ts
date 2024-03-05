import { Server } from '@aws/language-server-runtimes'
import { CredentialsProvider } from '@aws/language-server-runtimes/out/features'
import { SecurityScanRequestParams } from '@aws/language-server-runtimes/out/features/securityScan/securityScan'
import { pathToFileURL } from 'url'
import { CodeWhispererServiceToken } from './codeWhispererService'
import { SecurityScanHandler } from './securityScan/securityScanHandler'
import { parseJson } from './utils'

export const SecurityScanServerToken =
    (service: (credentialsProvider: CredentialsProvider) => CodeWhispererServiceToken): Server =>
    ({ credentialsProvider, workspace, logging }) => {
        const codewhispererclient = service(credentialsProvider)

        const runSecurityScan = async (params: SecurityScanRequestParams) => {
            if (!credentialsProvider.hasCredentials('bearer')) {
                // Todo: notify client that given credentials are not for bearer token.
                throw new Error('credentialsrProvider does not have bearer token credentials')
            }

            const scanHandler = new SecurityScanHandler(codewhispererclient, workspace)

            try {
                if (!params.arguments || params.arguments.length === 0) {
                    throw new Error(`Incorrect params provided. Params: ${params}`)
                }
                const [arg] = params.arguments
                const { activeFilePath, projectPath } = parseJson(arg)

                if (!activeFilePath || !projectPath) {
                    logging.log(`Error: file path or project path not provided. Params: ${params}`)
                    // Todo: notify client that given params are incorrect.
                    throw new Error(`Error: file path or project path not provided. Params: ${params}`)
                }
                const documentUri = pathToFileURL(activeFilePath).href
                const document = await workspace.getTextDocument(documentUri)
                if (!document) {
                    // Todo: notify client that text document is undefined.
                    throw new Error('Text document for given activeFilePath is undefined.')
                }
                /**
                 * Step 1: Generate context truncations
                 */
                // Todo: add create zip buffer and dependecy graph

                /**
                 * Step 2: Get presigned Url, upload and clean up
                 */
                // Todo: update zipBuffer to use zipped buffer value from dependency graph after truncation.
                const zipBuffer = Buffer.from('')
                const artifactMap = await scanHandler.createCodeResourcePresignedUrlHandler(zipBuffer)
                /**
                 * Step 3:  Create scan job
                 */
                const scanJob = await scanHandler.createScanJob(artifactMap, document.languageId.toLowerCase())

                /**
                 * Step 4:  Polling mechanism on scan job status
                 */
                const jobStatus = await scanHandler.pollScanJobStatus(scanJob.jobId)
                if (jobStatus === 'Failed') {
                    logging.log('security scan job failed.')
                    throw new Error('security scan job failed.')
                    // Todo: notify client about scan job failure.
                }

                /**
                 * Step 5: Process and render scan results
                 */
                await scanHandler.listScanResults(scanJob.jobId, projectPath)

                /**
                 * Step 6: send results to diagnostics
                 */
                // Todo: update diagnostics to add new issues
            } catch (error) {
                logging.log(String(error))
                // Todo: notify client about scan job failure.
            }
        }
        // Todo: register the securityScan command
        logging.log('SecurityScan server has been initialized')

        return () => {
            // dispose function
        }
    }
