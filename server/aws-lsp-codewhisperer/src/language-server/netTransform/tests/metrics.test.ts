import { expect } from 'chai'
import { Telemetry } from '@aws/language-server-runtimes/server-interface'
import {
    CancelTransformRequest,
    CancelTransformResponse,
    DownloadArtifactsRequest,
    DownloadArtifactsResponse,
    GetTransformPlanRequest,
    GetTransformPlanResponse,
    GetTransformRequest,
    GetTransformResponse,
    StartTransformRequest,
    StartTransformResponse,
    CancellationJobStatus,
} from '../models'
import {
    TransformationFailureEvent,
    TransformationJobArtifactsDownloadedEvent,
    TransformationJobCancelledEvent,
    TransformationJobReceivedEvent,
    TransformationJobStartedEvent,
    TransformationPlanReceivedEvent,
} from '../../telemetry/types'
import { TransformationSpec } from '../../../client/token/codewhispererbearertokenclient'
import sinon = require('sinon')
import {
    emitTransformationJobStartedTelemetry,
    emitTransformationJobStartedFailure,
    emitTransformationJobReceivedTelemetry,
    emitTransformationJobReceivedFailure,
    emitTransformationJobCancelledTelemetry,
    emitTransformationJobCancelledFailure,
    emitTransformationJobPolledTelemetry,
    emitTransformationJobPolledFailure,
    emitTransformationJobPolledForPlanTelemetry,
    emitTransformationJobPolledForPlanFailure,
    emitTransformationPlanReceivedTelemetry,
    emitTransformationPlanReceivedFailure,
    emitTransformationJobArtifactsDownloadedTelemetry,
    emitTransformationJobArtifactsDownloadedFailure,
} from '../metrics'
import { flattenMetric } from '../../utils'

export const CODETRANSFORM_CATEGORY = 'codeTransform'

describe('Test metrics functinalities', () => {
    let telemetry: sinon.SinonStubbedInstance<Telemetry>
    beforeEach(() => {
        telemetry = {
            emitMetric: sinon.stub(),
            onClientTelemetry: sinon.stub(),
        }
    })

    it('when calling emitTransformationJobStartedTelemetry it should emit telemetry metric', () => {
        const mockStartTransformResponse: StartTransformResponse = {
            UploadId: 'testUploadId',
            TransformationJobId: 'testJobId',
            ArtifactPath: 'test.csproj',
        }

        const expectedData: TransformationJobStartedEvent = {
            category: CODETRANSFORM_CATEGORY,
            transformationJobId: mockStartTransformResponse.TransformationJobId,
            uploadId: mockStartTransformResponse.UploadId,
            error: mockStartTransformResponse.Error as string,
        }
        emitTransformationJobStartedTelemetry(telemetry, mockStartTransformResponse)

        expect(telemetry.emitMetric.calledOnce).to.be.true
        expect(
            telemetry.emitMetric.calledWithExactly({
                name: 'codeTransform_jobIsStartedByUser',
                result: 'Succeeded',
                data: flattenMetric(expectedData),
            })
        ).to.be.true
    })

    it('should emit the correct telemetry metric on failure when calling emitTransformationJobStartedFailure', () => {
        const mockStartTransformRequest: StartTransformRequest = {
            SolutionRootPath: '',
            SelectedProjectPath: 'test.csproj',
            ProgramLanguage: 'csharp',
            TargetFramework: 'net8.0',
            SolutionConfigPaths: [],
            ProjectMetadata: [],
            command: '',
        }
        const mockError = new Error('Test error message')

        const expectedData: TransformationFailureEvent = {
            category: CODETRANSFORM_CATEGORY,
            programLanguage: mockStartTransformRequest.ProgramLanguage,
            selectedProjectPath: mockStartTransformRequest.SelectedProjectPath,
            targetFramework: mockStartTransformRequest.TargetFramework,
        }

        emitTransformationJobStartedFailure(telemetry, mockStartTransformRequest, mockError)

        expect(telemetry.emitMetric.calledOnce).to.be.true
        expect(
            telemetry.emitMetric.calledWithExactly({
                name: 'codeTransform_jobIsStartedByUser',
                result: 'Failed',
                errorData: {
                    reason: 'Test error message',
                },
            })
        ).to.be.true
    })

    it('should emit the correct telemetry metric on failure when calling emitTransformationJobStartedFailure without providing error message', () => {
        const mockStartTransformRequest: StartTransformRequest = {
            SolutionRootPath: '',
            SelectedProjectPath: 'test.csproj',
            ProgramLanguage: 'csharp',
            TargetFramework: 'net8.0',
            SolutionConfigPaths: [],
            ProjectMetadata: [],
            command: '',
        }
        const mockError = new Error()

        const expectedData: TransformationFailureEvent = {
            category: CODETRANSFORM_CATEGORY,
            programLanguage: mockStartTransformRequest.ProgramLanguage,
            selectedProjectPath: mockStartTransformRequest.SelectedProjectPath,
            targetFramework: mockStartTransformRequest.TargetFramework,
        }

        emitTransformationJobStartedFailure(telemetry, mockStartTransformRequest, mockError)

        expect(telemetry.emitMetric.calledOnce).to.be.true
        expect(
            telemetry.emitMetric.calledWithExactly({
                name: 'codeTransform_jobIsStartedByUser',
                result: 'Failed',
                errorData: {
                    reason: 'UnknownError',
                },
            })
        ).to.be.true
    })

    it('should handle any error thrown within the function when calling emitTransformationJobStartedFailure without providing error message', () => {
        const mockStartTransformRequest: StartTransformRequest = {
            SolutionRootPath: '',
            SelectedProjectPath: 'test.csproj',
            ProgramLanguage: 'csharp',
            TargetFramework: 'net8.0',
            SolutionConfigPaths: [],
            ProjectMetadata: [],
            command: '',
        }
        const mockError = new Error()
        telemetry.emitMetric.throws(new Error('Internal Telemetry Error'))

        try {
            emitTransformationJobStartedFailure(telemetry, mockStartTransformRequest, mockError)
        } catch (e) {
            // The function should not throw any errors
            expect.fail('The function should not throw any errors')
        }

        expect(telemetry.emitMetric.calledOnce).to.be.true
    })

    it('should emit the correct telemetry metric when calling emitTransformationJobReceivedTelemetry', () => {
        const mockGetTransformResponse: GetTransformResponse = {
            TransformationJob: {
                jobId: 'testJobId',
                transformationSpec: {
                    transformationType: 'LANGUAGE_UPGRADE',
                },
                status: 'COMPLETED',
                reason: '',
                creationTime: new Date(),
                startExecutionTime: new Date(),
                endExecutionTime: new Date(),
            },
        }

        const expectedData: TransformationJobReceivedEvent = {
            category: CODETRANSFORM_CATEGORY,
            transformationJobId: mockGetTransformResponse.TransformationJob?.jobId as string,
            transformationJobStatus: mockGetTransformResponse.TransformationJob?.status as string,
            creationTime: mockGetTransformResponse.TransformationJob?.creationTime as Date,
            startExecutionTime: mockGetTransformResponse.TransformationJob?.startExecutionTime as Date,
            endExecutionTime: mockGetTransformResponse.TransformationJob?.endExecutionTime as Date,
            reason: mockGetTransformResponse.TransformationJob?.reason as string,
            transformationSpec: mockGetTransformResponse.TransformationJob?.transformationSpec as TransformationSpec,
        }

        emitTransformationJobReceivedTelemetry(telemetry, mockGetTransformResponse)

        expect(telemetry.emitMetric.calledOnce).to.be.true
        expect(
            telemetry.emitMetric.calledWithExactly({
                name: 'codeTransform_jobIsReceivedByUser',
                result: 'Succeeded',
                data: flattenMetric(expectedData),
            })
        ).to.be.true
    })

    it('should emit the correct telemetry metric on failure when calling emitTransformationJobReceivedFailure', () => {
        const mockGetTransformRequest: GetTransformRequest = {
            TransformationJobId: 'testJobId',
            command: '',
        }

        const expectedData: TransformationFailureEvent = {
            category: CODETRANSFORM_CATEGORY,
            transformationJobId: mockGetTransformRequest.TransformationJobId,
        }
        const mockError = new Error('Test error message')

        emitTransformationJobReceivedFailure(telemetry, mockGetTransformRequest, mockError)
        expect(telemetry.emitMetric.calledOnce).to.be.true
        expect(
            telemetry.emitMetric.calledWithExactly({
                name: 'codeTransform_jobIsReceivedByUser',
                result: 'Failed',
                data: expectedData,
                errorData: {
                    reason: 'Test error message',
                },
            })
        ).to.be.true
    })

    it('should emit the correct telemetry metric on failure when calling emitTransformationJobReceivedFailure without providig an error message', () => {
        const mockGetTransformRequest: GetTransformRequest = {
            TransformationJobId: 'testJobId',
            command: '',
        }

        const expectedData: TransformationFailureEvent = {
            category: CODETRANSFORM_CATEGORY,
            transformationJobId: mockGetTransformRequest.TransformationJobId,
        }
        const mockError = new Error()

        emitTransformationJobReceivedFailure(telemetry, mockGetTransformRequest, mockError)
        expect(telemetry.emitMetric.calledOnce).to.be.true
        expect(
            telemetry.emitMetric.calledWithExactly({
                name: 'codeTransform_jobIsReceivedByUser',
                result: 'Failed',
                data: expectedData,
                errorData: {
                    reason: 'UnknownError',
                },
            })
        ).to.be.true
    })

    it('should emit the correct metrics when calling emitTransformationJobCancelledTelemetry', () => {
        const mockCancelTransformResponse: CancelTransformResponse = {
            TransformationJobStatus: CancellationJobStatus.SUCCESSFULLY_CANCELLED,
        }
        const mockJobId = 'testJobId'

        const expectedData: TransformationJobCancelledEvent = {
            category: CODETRANSFORM_CATEGORY,
            transformationJobId: mockJobId,
            cancellationJobStatus: mockCancelTransformResponse.TransformationJobStatus,
        }
        emitTransformationJobCancelledTelemetry(telemetry, mockCancelTransformResponse, mockJobId)

        expect(telemetry.emitMetric.calledOnce).to.be.true
        expect(
            telemetry.emitMetric.calledWithExactly({
                name: 'codeTransform_jobIsCancelledByUser',
                result: 'Succeeded',
                data: flattenMetric(expectedData),
            })
        ).to.be.true
    })

    it('should emit the correct metrics when calling emitTransformationJobCancelledFailure', () => {
        const mockCancelTransformRequest: CancelTransformRequest = {
            TransformationJobId: 'testJobId',
            command: '',
        }
        const expectedData: TransformationFailureEvent = {
            category: CODETRANSFORM_CATEGORY,
            transformationJobId: mockCancelTransformRequest.TransformationJobId,
        }
        const mockError = new Error('Test error message')
        emitTransformationJobCancelledFailure(telemetry, mockCancelTransformRequest, mockError)

        expect(telemetry.emitMetric.calledOnce).to.be.true
        expect(
            telemetry.emitMetric.calledWithExactly({
                name: 'codeTransform_jobIsCancelledByUser',
                result: 'Failed',
                data: expectedData,
                errorData: {
                    reason: 'Test error message',
                },
            })
        ).to.be.true
    })

    it('should emit the correct metrics when calling emitTransformationJobCancelledFailure without providing an error message', () => {
        const mockCancelTransformRequest: CancelTransformRequest = {
            TransformationJobId: 'testJobId',
            command: '',
        }
        const expectedData: TransformationFailureEvent = {
            category: CODETRANSFORM_CATEGORY,
            transformationJobId: mockCancelTransformRequest.TransformationJobId,
        }
        const mockError = new Error()
        emitTransformationJobCancelledFailure(telemetry, mockCancelTransformRequest, mockError)

        expect(telemetry.emitMetric.calledOnce).to.be.true
        expect(
            telemetry.emitMetric.calledWithExactly({
                name: 'codeTransform_jobIsCancelledByUser',
                result: 'Failed',
                data: expectedData,
                errorData: {
                    reason: 'UnknownError',
                },
            })
        ).to.be.true
    })

    it('should emit the correct metrics when calling emitTransformationJobPolledTelemetry', () => {
        const mockGetTransformResponse: GetTransformResponse = {
            TransformationJob: {
                jobId: 'testJobId',
                transformationSpec: {
                    transformationType: 'LANGUAGE_UPGRADE',
                },
                status: 'COMPLETED',
                reason: '',
                creationTime: new Date(),
                startExecutionTime: new Date(),
                endExecutionTime: new Date(),
            },
        }

        const expectedData: TransformationJobReceivedEvent = {
            category: CODETRANSFORM_CATEGORY,
            transformationJobId: mockGetTransformResponse.TransformationJob?.jobId as string,
            transformationJobStatus: mockGetTransformResponse.TransformationJob?.status as string,
            creationTime: mockGetTransformResponse.TransformationJob?.creationTime as Date,
            startExecutionTime: mockGetTransformResponse.TransformationJob?.startExecutionTime as Date,
            endExecutionTime: mockGetTransformResponse.TransformationJob?.endExecutionTime as Date,
            reason: mockGetTransformResponse.TransformationJob?.reason as string,
            transformationSpec: mockGetTransformResponse.TransformationJob?.transformationSpec as TransformationSpec,
        }
        emitTransformationJobPolledTelemetry(telemetry, mockGetTransformResponse)

        expect(telemetry.emitMetric.calledOnce).to.be.true
        expect(
            telemetry.emitMetric.calledWithExactly({
                name: 'codeTransform_jobIsPolledByUser',
                result: 'Succeeded',
                data: flattenMetric(expectedData),
            })
        ).to.be.true
    })

    it('should emit the correct metrics when calling emitTransformationJobPolledFailure', () => {
        const mockGetTransformRequest: GetTransformRequest = {
            TransformationJobId: 'testJobId',
            command: '',
        }
        const expectedData: TransformationFailureEvent = {
            category: CODETRANSFORM_CATEGORY,
            transformationJobId: mockGetTransformRequest.TransformationJobId,
        }
        const mockError = new Error('Test error message')
        emitTransformationJobPolledFailure(telemetry, mockGetTransformRequest, mockError)

        expect(telemetry.emitMetric.calledOnce).to.be.true
        expect(
            telemetry.emitMetric.calledWithExactly({
                name: 'codeTransform_jobIsPolledByUser',
                result: 'Failed',
                data: expectedData,
                errorData: {
                    reason: 'Test error message',
                },
            })
        ).to.be.true
    })

    it('should emit the correct metrics when calling emitTransformationJobPolledFailure without providing an error message', () => {
        const mockGetTransformRequest: GetTransformRequest = {
            TransformationJobId: 'testJobId',
            command: '',
        }
        const expectedData: TransformationFailureEvent = {
            category: CODETRANSFORM_CATEGORY,
            transformationJobId: mockGetTransformRequest.TransformationJobId,
        }
        const mockError = new Error()
        emitTransformationJobPolledFailure(telemetry, mockGetTransformRequest, mockError)

        expect(telemetry.emitMetric.calledOnce).to.be.true
        expect(
            telemetry.emitMetric.calledWithExactly({
                name: 'codeTransform_jobIsPolledByUser',
                result: 'Failed',
                data: expectedData,
                errorData: {
                    reason: 'UnknownError',
                },
            })
        ).to.be.true
    })

    it('should emit the correct metrics when calling emitTransformationJobPolledForPlanTelemetry', () => {
        const mockGetTransformResponse: GetTransformResponse = {
            TransformationJob: {
                jobId: 'testJobId',
                transformationSpec: {
                    transformationType: 'LANGUAGE_UPGRADE',
                },
                status: 'COMPLETED',
                reason: '',
                creationTime: new Date(),
                startExecutionTime: new Date(),
                endExecutionTime: new Date(),
            },
        }
        const expectedData: TransformationJobReceivedEvent = {
            category: CODETRANSFORM_CATEGORY,
            transformationJobId: mockGetTransformResponse.TransformationJob?.jobId as string,
            transformationJobStatus: mockGetTransformResponse.TransformationJob?.status as string,
            creationTime: mockGetTransformResponse.TransformationJob?.creationTime as Date,
            startExecutionTime: mockGetTransformResponse.TransformationJob?.startExecutionTime as Date,
            endExecutionTime: mockGetTransformResponse.TransformationJob?.endExecutionTime as Date,
            reason: mockGetTransformResponse.TransformationJob?.reason as string,
            transformationSpec: mockGetTransformResponse.TransformationJob?.transformationSpec as TransformationSpec,
        }
        const mockError = new Error()
        emitTransformationJobPolledForPlanTelemetry(telemetry, mockGetTransformResponse)

        expect(telemetry.emitMetric.calledOnce).to.be.true
        expect(
            telemetry.emitMetric.calledWithExactly({
                name: 'codeTransform_jobIsPolledForPlanByUser',
                result: 'Succeeded',
                data: flattenMetric(expectedData),
            })
        ).to.be.true
    })

    it('should emit the correct metrics when calling emitTransformationJobPolledForPlanFailure', () => {
        const mockGetTransformRequest: GetTransformRequest = {
            TransformationJobId: 'testJobId',
            command: '',
        }
        const expectedData: TransformationFailureEvent = {
            category: CODETRANSFORM_CATEGORY,
            transformationJobId: mockGetTransformRequest.TransformationJobId,
        }
        const mockError = new Error('Test error message')
        emitTransformationJobPolledForPlanFailure(telemetry, mockGetTransformRequest, mockError)

        expect(telemetry.emitMetric.calledOnce).to.be.true
        expect(
            telemetry.emitMetric.calledWithExactly({
                name: 'codeTransform_jobIsPolledForPlanByUser',
                result: 'Failed',
                data: expectedData,
                errorData: {
                    reason: 'Test error message',
                },
            })
        ).to.be.true
    })

    it('should emit the correct metrics when calling emitTransformationJobPolledForPlanFailure without providing an error message', () => {
        const mockGetTransformRequest: GetTransformRequest = {
            TransformationJobId: 'testJobId',
            command: '',
        }
        const expectedData: TransformationFailureEvent = {
            category: CODETRANSFORM_CATEGORY,
            transformationJobId: mockGetTransformRequest.TransformationJobId,
        }
        const mockError = new Error()
        emitTransformationJobPolledForPlanFailure(telemetry, mockGetTransformRequest, mockError)

        expect(telemetry.emitMetric.calledOnce).to.be.true
        expect(
            telemetry.emitMetric.calledWithExactly({
                name: 'codeTransform_jobIsPolledForPlanByUser',
                result: 'Failed',
                data: expectedData,
                errorData: {
                    reason: 'UnknownError',
                },
            })
        ).to.be.true
    })

    it('should emit the correct metrics when calling emitTransformationPlanReceivedTelemetry', () => {
        const mockJobId = 'testJobId'
        const mockGetTransformResponse: GetTransformPlanResponse = {
            TransformationPlan: {
                transformationSteps: [],
            },
        }
        const expectedData: TransformationPlanReceivedEvent = {
            category: CODETRANSFORM_CATEGORY,
            transformationJobId: mockJobId as string,
            transformationSteps: mockGetTransformResponse.TransformationPlan.transformationSteps,
        }
        emitTransformationPlanReceivedTelemetry(telemetry, mockGetTransformResponse, mockJobId)

        expect(telemetry.emitMetric.calledOnce).to.be.true
        expect(
            telemetry.emitMetric.calledWithExactly({
                name: 'codeTransform_planIsReceivedByUser',
                result: 'Succeeded',
                data: flattenMetric(expectedData),
            })
        ).to.be.true
    })

    it('should emit the correct metrics when calling emitTransformationPlanReceivedFailure', () => {
        const mockGetTransformResponse: GetTransformPlanRequest = {
            TransformationJobId: 'testTransformationId',
            command: '',
        }
        const expectedData: TransformationFailureEvent = {
            category: CODETRANSFORM_CATEGORY,
            transformationJobId: mockGetTransformResponse.TransformationJobId,
        }
        const mockError = new Error('Test error message')
        emitTransformationPlanReceivedFailure(telemetry, mockGetTransformResponse, mockError)

        expect(telemetry.emitMetric.calledOnce).to.be.true
        expect(
            telemetry.emitMetric.calledWithExactly({
                name: 'codeTransform_planIsReceivedByUser',
                result: 'Failed',
                data: expectedData,
                errorData: {
                    reason: 'Test error message',
                },
            })
        ).to.be.true
    })

    it('should emit the correct metrics when calling emitTransformationPlanReceivedFailure without providing an error message', () => {
        const mockGetTransformResponse: GetTransformPlanRequest = {
            TransformationJobId: 'testTransformationId',
            command: '',
        }
        const expectedData: TransformationFailureEvent = {
            category: CODETRANSFORM_CATEGORY,
            transformationJobId: mockGetTransformResponse.TransformationJobId,
        }
        const mockError = new Error()
        emitTransformationPlanReceivedFailure(telemetry, mockGetTransformResponse, mockError)

        expect(telemetry.emitMetric.calledOnce).to.be.true
        expect(
            telemetry.emitMetric.calledWithExactly({
                name: 'codeTransform_planIsReceivedByUser',
                result: 'Failed',
                data: expectedData,
                errorData: {
                    reason: 'UnknownError',
                },
            })
        ).to.be.true
    })

    it('should emit the correct metrics when calling emitTransformationJobArtifactsDownloadedTelemetry', () => {
        const mockJobId = 'testJobId'
        const mockDownloadArtifactsResponse: DownloadArtifactsResponse = {
            PathTosave: 'testPath',
            Error: 'TestError',
        }
        const expectedData: TransformationJobArtifactsDownloadedEvent = {
            category: CODETRANSFORM_CATEGORY,
            transformationJobId: mockJobId,
            error: mockDownloadArtifactsResponse.Error,
        }
        emitTransformationJobArtifactsDownloadedTelemetry(telemetry, mockDownloadArtifactsResponse, mockJobId)

        expect(telemetry.emitMetric.calledOnce).to.be.true
        expect(
            telemetry.emitMetric.calledWithExactly({
                name: 'codeTransform_artifactsAreDownloadedByUser',
                result: 'Succeeded',
                data: flattenMetric(expectedData),
            })
        ).to.be.true
    })

    it('should emit the correct metrics when calling emitTransformationJobArtifactsDownloadedFailure', () => {
        const mockDownloadArtifactsRequest: DownloadArtifactsRequest = {
            TransformationJobId: 'testJobId',
            SolutionRootPath: 'testSolutionRootPath',
            command: '',
        }
        const expectedData: TransformationFailureEvent = {
            category: CODETRANSFORM_CATEGORY,
            transformationJobId: mockDownloadArtifactsRequest.TransformationJobId,
        }
        const mockError = new Error('Test error message')
        emitTransformationJobArtifactsDownloadedFailure(telemetry, mockDownloadArtifactsRequest, mockError)

        expect(telemetry.emitMetric.calledOnce).to.be.true
        expect(
            telemetry.emitMetric.calledWithExactly({
                name: 'codeTransform_artifactsAreDownloadedByUser',
                result: 'Failed',
                data: expectedData,
                errorData: {
                    reason: 'Test error message',
                },
            })
        ).to.be.true
    })

    it('should emit the correct metrics when calling emitTransformationJobArtifactsDownloadedFailure without providing an error message', () => {
        const mockDownloadArtifactsRequest: DownloadArtifactsRequest = {
            TransformationJobId: 'testJobId',
            SolutionRootPath: 'testSolutionRootPath',
            command: '',
        }
        const expectedData: TransformationFailureEvent = {
            category: CODETRANSFORM_CATEGORY,
            transformationJobId: mockDownloadArtifactsRequest.TransformationJobId,
        }
        const mockError = new Error()
        emitTransformationJobArtifactsDownloadedFailure(telemetry, mockDownloadArtifactsRequest, mockError)

        expect(telemetry.emitMetric.calledOnce).to.be.true
        expect(
            telemetry.emitMetric.calledWithExactly({
                name: 'codeTransform_artifactsAreDownloadedByUser',
                result: 'Failed',
                data: expectedData,
                errorData: {
                    reason: 'UnknownError',
                },
            })
        ).to.be.true
    })
})
