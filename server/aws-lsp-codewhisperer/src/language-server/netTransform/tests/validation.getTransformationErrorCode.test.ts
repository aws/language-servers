import { expect } from 'chai'
import { TransformationErrorCode } from '../models'
import { getTransformationErrorCode } from '../validation'
import { TransformationJob } from '../../../client/token/codewhispererbearertokenclient'

describe('getTransformationErrorCode', () => {
    it('should return NONE when transformationJob is undefined', () => {
        const result = getTransformationErrorCode(undefined)
        expect(result).to.equal(TransformationErrorCode.NONE)
    })

    it('should return NONE when status is not a failure state', () => {
        const job: TransformationJob = {
            jobId: 'test-job-id',
            status: 'COMPLETED',
            creationTime: new Date(),
        }
        const result = getTransformationErrorCode(job)
        expect(result).to.equal(TransformationErrorCode.NONE)
    })

    it('should return QUOTA_EXCEEDED when status is FAILED and reason contains "would exceed your remaining quota"', () => {
        const job: TransformationJob = {
            jobId: 'test-job-id',
            status: 'FAILED',
            reason: 'the project was stopped because the projected resource usage would exceed your remaining quota.',
            creationTime: new Date(),
        }
        const result = getTransformationErrorCode(job)
        expect(result).to.equal(TransformationErrorCode.QUOTA_EXCEEDED)
    })

    it('should return UNKNOWN_ERROR when status is FAILED but reason does not match any patterns', () => {
        const job: TransformationJob = {
            jobId: 'test-job-id',
            status: 'FAILED',
            reason: 'Some other error occurred',
            creationTime: new Date(),
        }
        const result = getTransformationErrorCode(job)
        expect(result).to.equal(TransformationErrorCode.UNKNOWN_ERROR)
    })

    it('should return UNKNOWN_ERROR when status is FAILED and reason is undefined', () => {
        const job: TransformationJob = {
            jobId: 'test-job-id',
            status: 'FAILED',
            creationTime: new Date(),
        }
        const result = getTransformationErrorCode(job)
        expect(result).to.equal(TransformationErrorCode.UNKNOWN_ERROR)
    })

    it('should return UNKNOWN_ERROR when status is STOPPED', () => {
        const job: TransformationJob = {
            jobId: 'test-job-id',
            status: 'STOPPED',
            creationTime: new Date(),
        }
        const result = getTransformationErrorCode(job)
        expect(result).to.equal(TransformationErrorCode.UNKNOWN_ERROR)
    })

    it('should return UNKNOWN_ERROR when status is REJECTED', () => {
        const job: TransformationJob = {
            jobId: 'test-job-id',
            status: 'REJECTED',
            creationTime: new Date(),
        }
        const result = getTransformationErrorCode(job)
        expect(result).to.equal(TransformationErrorCode.UNKNOWN_ERROR)
    })
})
