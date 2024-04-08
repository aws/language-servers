import {
    Server,
    CredentialsProvider,
    CancellationToken,
    ExecuteCommandParams,
} from '@aws/language-server-runtimes/server-interface'
import { CodeWhispererServiceToken } from './codeWhispererService'
import {
    QNetCancelTransformRequest,
    QNetDownloadArtifactsRequest,
    QNetGetTransformPlanRequest,
    QNetGetTransformRequest,
    QNetStartTransformRequest,
} from './netTransform/models'
import { TransformHandler } from './netTransform/transformHandler'
import { StreamingClient } from '../client/streamingClient/codewhispererStreamingClient'

export const validStatesForGettingPlan = ['COMPLETED', 'PARTIALLY_COMPLETED', 'PLANNED', 'TRANSFORMING', 'TRANSFORMED']
export const validStatesForComplete = ['COMPLETED']
export const failureStates = ['FAILED', 'STOPPING', 'STOPPED', 'REJECTED']
const StartTransformCommand = 'aws/qNetTransform/startTransform'
const GetTransformCommand = 'aws/qNetTransform/getTransform'
const PollTransformCommand = 'aws/qNetTransform/pollTransform'
const PollTransformForPlanCommand = 'aws/qNetTransform/pollTransformForPlan'
const GetTransformPlanCommand = 'aws/qNetTransform/getTransformPlan'
const CancelTransformCommand = 'aws/qNetTransform/cancelTransform'
const DownloadArtifactsCommand = 'aws/qNetTransform/downloadArtifacts'

/**
 *
 * @param createService Inject service instance based on credentials provider.
 * @returns  NetTransform server
 */
export const NetTransformServerFactory: (
    createService: (credentialsProvider: CredentialsProvider) => CodeWhispererServiceToken
) => Server =
    createService =>
    ({ credentialsProvider, lsp, workspace, telemetry, logging }) => {
        const service = createService(credentialsProvider)
        const onExecuteCommandHandler = async (
            params: ExecuteCommandParams,
            _token: CancellationToken
        ): Promise<any> => {
            try {
                const client = createService(credentialsProvider)
                const transformHandler = new TransformHandler(client, workspace, logging)
                switch (params.command) {
                    case StartTransformCommand: {
                        const userInputrequest = params as QNetStartTransformRequest
                        logging.log('prepare artifact for solution: ' + userInputrequest.SolutionRootPath)
                        return await transformHandler.startTransformation(userInputrequest)
                    }
                    case GetTransformCommand: {
                        const request = params as QNetGetTransformRequest
                        logging.log('Calling getTransform request with job Id: ' + request.TransformationJobId)
                        return await transformHandler.getTransformation(request)
                    }
                    case PollTransformCommand: {
                        const request = params as QNetGetTransformRequest
                        logging.log('Calling pollTransform request with job Id: ' + request.TransformationJobId)
                        const transformationJob = await transformHandler.pollTransformation(
                            request,
                            validStatesForComplete,
                            failureStates
                        )
                        logging.log(
                            'Transformation job for job Id' +
                                request.TransformationJobId +
                                ' is ' +
                                JSON.stringify(transformationJob)
                        )
                        return transformationJob
                    }
                    case PollTransformForPlanCommand: {
                        const request = params as QNetGetTransformRequest
                        logging.log('Calling pollTransformForPlan request with job Id: ' + request.TransformationJobId)
                        const transformationJob = await transformHandler.pollTransformation(
                            request,
                            validStatesForGettingPlan,
                            failureStates
                        )
                        logging.log(
                            'Transformation job for job Id' +
                                request.TransformationJobId +
                                ' is ' +
                                JSON.stringify(transformationJob)
                        )
                        return transformationJob
                    }
                    case GetTransformPlanCommand: {
                        const request = params as QNetGetTransformPlanRequest
                        logging.log('Calling getTransformPlan request with job Id: ' + request.TransformationJobId)
                        const transformationPlan = await transformHandler.getTransformationPlan(request)
                        logging.log(
                            'Transformation plan for job Id' +
                                request.TransformationJobId +
                                ' is ' +
                                JSON.stringify(transformationPlan)
                        )
                        return transformationPlan
                    }
                    case CancelTransformCommand: {
                        const request = params as QNetCancelTransformRequest
                        logging.log('request job ID: ' + request.TransformationJobId)
                        return await transformHandler.cancelTransformation(request)
                    }
                    case DownloadArtifactsCommand: {
                        const request = params as QNetDownloadArtifactsRequest
                        const cwStreamingClientInstance = new StreamingClient()
                        const cwStreamingClient =
                            await cwStreamingClientInstance.getStreamingClient(credentialsProvider)
                        logging.log('Calling Download Archive  with job Id: ' + request.TransformationJobId)
                        return await transformHandler.downloadExportResultArchive(
                            cwStreamingClient,
                            request.TransformationJobId
                        )
                    }
                }
                return
            } catch (e: any) {
                logging.log('Server side error while executing transformer Command ' + e)
            }
        }
        const onInitializeHandler = () => {
            return {
                capabilities: {
                    executeCommandProvider: {
                        commands: [
                            StartTransformCommand,
                            GetTransformCommand,
                            PollTransformCommand,
                            PollTransformForPlanCommand,
                            GetTransformPlanCommand,
                            CancelTransformCommand,
                            DownloadArtifactsCommand,
                        ],
                    },
                },
            }
        }
        lsp.addInitializer(onInitializeHandler)

        // Do the thing
        lsp.onExecuteCommand(onExecuteCommandHandler)

        // Disposable
        return () => {
            // Do nothing
        }
    }

/**
 * Default NetTransformServer using Token authentication.
 */
export const NetTransformServer = NetTransformServerFactory(
    credentialsProvider => new CodeWhispererServiceToken(credentialsProvider, {})
)
