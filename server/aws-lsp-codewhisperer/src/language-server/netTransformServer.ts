import {
    Server,
    CredentialsProvider,
    CancellationToken,
    ExecuteCommandParams,
} from '@aws/language-server-runtimes/server-interface'
import { CodeWhispererServiceToken } from './codeWhispererService'
import {
    QNetCancelTransformRequest,
    QNetGetTransformPlanRequest,
    QNetGetTransformRequest,
    QNetStartTransformRequest,
} from './netTransform/models'
import { TransformHandler } from './netTransform/transformHandler'

export const validStatesForGettingPlan = ['COMPLETED', 'PARTIALLY_COMPLETED', 'PLANNED', 'TRANSFORMING', 'TRANSFORMED']
export const validStatesForComplete = ['COMPLETED']
export const failureStates = ['FAILED', 'STOPPING', 'STOPPED', 'REJECTED']

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
                    case 'aws/qNetTransform/startTransform': {
                        const userInputrequest = params as QNetStartTransformRequest
                        logging.log('prepare artifact for solution: ' + userInputrequest.SolutionRootPath)
                        return await transformHandler.startTransformation(userInputrequest)
                    }
                    case 'aws/qNetTransform/getTransform': {
                        const request = params as QNetGetTransformRequest
                        logging.log('Calling getTransform request with job Id: ' + request.TransformationJobId)
                        return await transformHandler.getTransformation(request)
                    }
                    case 'aws/qNetTransform/pollTransform': {
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
                    case 'aws/qNetTransform/pollTransformForPlan': {
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
                    case 'aws/qNetTransform/getTransformPlan': {
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
                    case 'aws/qNetTransform/cancelTransform': {
                        const request = params as QNetCancelTransformRequest
                        logging.log('request job ID: ' + request.TransformationJobId)
                        return await transformHandler.cancelTransformation(request)
                    }
                }
                return
            } catch (e: any) {
                logging.log('Server side error while executing transformer Command ' + e)
            }
        }

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