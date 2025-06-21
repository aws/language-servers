import * as assert from 'assert'
import {
    AgenticChatError,
    DirectoryNotFoundError,
    EmptyAppendContentError,
    EmptyDiffsError,
    EmptyPathError,
    FileExistsWithSameContentError,
    FileNotExistsError,
    FileOperationError,
    IsDirectoryError,
    MissingContentError,
    MultipleMatchesError,
    NoSpaceError,
    PermissionDeniedError,
    TextNotFoundError,
    TooManyOpenFilesError,
    createFileOperationError,
    getCustomerFacingErrorMessage,
    isThrottlingRelated,
} from './errors'

describe('errors', () => {
    describe('FileOperationError classes', () => {
        it('creates error classes with correct customer messages', () => {
            const directoryError = new DirectoryNotFoundError('ENOENT: no such file or directory')
            assert.strictEqual(directoryError.message, 'ENOENT: no such file or directory')
            assert.strictEqual(directoryError.customerMessage, 'The directory does not exist.')

            const permissionError = new PermissionDeniedError('EACCES: permission denied')
            assert.strictEqual(permissionError.customerMessage, 'Permission denied.')

            const emptyPathError = new EmptyPathError()
            assert.strictEqual(emptyPathError.message, 'Path must not be empty')
            assert.strictEqual(emptyPathError.customerMessage, 'The file path cannot be empty.')
        })
    })

    describe('createFileOperationError', () => {
        it('maps common file system errors', () => {
            const error1 = createFileOperationError(new Error('ENOENT: no such file or directory'))
            assert.ok(error1 instanceof DirectoryNotFoundError)
            assert.strictEqual(error1.customerMessage, 'The directory does not exist.')

            const error2 = createFileOperationError(new Error('EACCES: permission denied'))
            assert.ok(error2 instanceof PermissionDeniedError)

            const error3 = createFileOperationError(new Error('EISDIR: is a directory'))
            assert.ok(error3 instanceof IsDirectoryError)

            const error4 = createFileOperationError(new Error('ENOSPC: no space left on device'))
            assert.ok(error4 instanceof NoSpaceError)

            const error5 = createFileOperationError(new Error('EMFILE: too many open files'))
            assert.ok(error5 instanceof TooManyOpenFilesError)
        })

        it('maps fsWrite specific errors', () => {
            const error1 = createFileOperationError(new Error('Path must not be empty'))
            assert.ok(error1 instanceof EmptyPathError)

            const error2 = createFileOperationError(new Error('fileText must be provided for create command'))
            assert.ok(error2 instanceof MissingContentError)

            const error3 = createFileOperationError(new Error('The file already exists with the same content'))
            assert.ok(error3 instanceof FileExistsWithSameContentError)

            const error4 = createFileOperationError(new Error('Content to append must not be empty'))
            assert.ok(error4 instanceof EmptyAppendContentError)
        })

        it('maps fsReplace specific errors', () => {
            const error1 = createFileOperationError(new Error('Diffs must not be empty'))
            assert.ok(error1 instanceof EmptyDiffsError)

            const error2 = createFileOperationError(
                new Error('The provided path must exist in order to replace contents into it')
            )
            assert.ok(error2 instanceof FileNotExistsError)

            const error3 = createFileOperationError(new Error('No occurrences of "some text" were found'))
            assert.ok(error3 instanceof TextNotFoundError)

            const error4 = createFileOperationError(
                new Error('Multiple occurrences of "some text" were found when only 1 is expected')
            )
            assert.ok(error4 instanceof MultipleMatchesError)
        })

        it('returns generic FileOperationError for unknown errors', () => {
            const unknownError = new Error('Some unknown error occurred')
            const result = createFileOperationError(unknownError)
            assert.ok(result instanceof FileOperationError)
            assert.strictEqual(result.message, 'Some unknown error occurred')
            assert.strictEqual(result.customerMessage, 'Some unknown error occurred')
        })
    })

    describe('getCustomerFacingErrorMessage', () => {
        it('returns customer message from FileOperationError', () => {
            const error = new EmptyPathError()
            assert.strictEqual(getCustomerFacingErrorMessage(error), 'The file path cannot be empty.')
        })

        it('creates and returns customer message from standard Error', () => {
            const error = new Error('ENOENT: no such file or directory')
            assert.strictEqual(getCustomerFacingErrorMessage(error), 'The directory does not exist.')
        })

        it('handles non-Error objects', () => {
            assert.strictEqual(getCustomerFacingErrorMessage('string error'), 'string error')
            assert.strictEqual(getCustomerFacingErrorMessage(null), 'null')
            assert.strictEqual(getCustomerFacingErrorMessage(undefined), 'undefined')
        })
    })

    describe('isThrottlingRelated', () => {
        it('should return true for AgenticChatError with RequestThrottled code', () => {
            const error = new AgenticChatError('Request was throttled', 'RequestThrottled')
            assert.strictEqual(isThrottlingRelated(error), true)
        })

        it('should return true for ServiceUnavailableException with OperationMaxRequestsHandler in stack', () => {
            const error = new Error('Service Unavailable')
            error.name = 'ServiceUnavailableException'
            error.stack = 'Error: Service Unavailable\n    at OperationMaxRequestsHandler.handle'

            assert.strictEqual(isThrottlingRelated(error), true)
        })

        it('should return false for ServiceUnavailableException without OperationMaxRequestsHandler in stack', () => {
            const error = new Error('Service Unavailable')
            error.name = 'ServiceUnavailableException'
            error.stack = 'Error: Service Unavailable\n    at SomeOtherHandler.handle'

            assert.strictEqual(isThrottlingRelated(error), false)
        })

        it('should return false for ServiceUnavailableException with null stack', () => {
            const error = new Error('Service Unavailable')
            error.name = 'ServiceUnavailableException'
            error.stack = null as unknown as string

            assert.strictEqual(isThrottlingRelated(error), false)
        })

        it('should return false for ServiceUnavailableException with undefined stack', () => {
            const error = new Error('Service Unavailable')
            error.name = 'ServiceUnavailableException'
            error.stack = undefined as unknown as string

            assert.strictEqual(isThrottlingRelated(error), false)
        })

        it('should return false for non-throttling related errors', () => {
            const error = new Error('Some other error')
            assert.strictEqual(isThrottlingRelated(error), false)
        })

        it('should return false for non-Error objects', () => {
            assert.strictEqual(isThrottlingRelated('not an error'), false)
            assert.strictEqual(isThrottlingRelated(null), false)
            assert.strictEqual(isThrottlingRelated(undefined), false)
            assert.strictEqual(isThrottlingRelated({}), false)
            assert.strictEqual(isThrottlingRelated(42), false)
        })
    })
})
