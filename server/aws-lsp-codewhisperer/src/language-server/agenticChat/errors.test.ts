import {
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
} from './errors'

describe('errors', () => {
    describe('FileOperationError classes', () => {
        test('creates error classes with correct customer messages', () => {
            const directoryError = new DirectoryNotFoundError('ENOENT: no such file or directory')
            expect(directoryError.message).toBe('ENOENT: no such file or directory')
            expect(directoryError.customerMessage).toBe(
                'The directory does not exist. Please create the directory first.'
            )

            const permissionError = new PermissionDeniedError('EACCES: permission denied')
            expect(permissionError.customerMessage).toBe(
                'Permission denied. You do not have sufficient permissions to modify this file.'
            )

            const emptyPathError = new EmptyPathError()
            expect(emptyPathError.message).toBe('Path must not be empty')
            expect(emptyPathError.customerMessage).toBe(
                'The file path cannot be empty. Please provide a valid file path.'
            )
        })
    })

    describe('createFileOperationError', () => {
        test('maps common file system errors', () => {
            const error1 = createFileOperationError(new Error('ENOENT: no such file or directory'))
            expect(error1).toBeInstanceOf(DirectoryNotFoundError)
            expect(error1.customerMessage).toBe('The directory does not exist. Please create the directory first.')

            const error2 = createFileOperationError(new Error('EACCES: permission denied'))
            expect(error2).toBeInstanceOf(PermissionDeniedError)

            const error3 = createFileOperationError(new Error('EISDIR: is a directory'))
            expect(error3).toBeInstanceOf(IsDirectoryError)

            const error4 = createFileOperationError(new Error('ENOSPC: no space left on device'))
            expect(error4).toBeInstanceOf(NoSpaceError)

            const error5 = createFileOperationError(new Error('EMFILE: too many open files'))
            expect(error5).toBeInstanceOf(TooManyOpenFilesError)
        })

        test('maps fsWrite specific errors', () => {
            const error1 = createFileOperationError(new Error('Path must not be empty'))
            expect(error1).toBeInstanceOf(EmptyPathError)

            const error2 = createFileOperationError(new Error('fileText must be provided for create command'))
            expect(error2).toBeInstanceOf(MissingContentError)

            const error3 = createFileOperationError(new Error('The file already exists with the same content'))
            expect(error3).toBeInstanceOf(FileExistsWithSameContentError)

            const error4 = createFileOperationError(new Error('Content to append must not be empty'))
            expect(error4).toBeInstanceOf(EmptyAppendContentError)
        })

        test('maps fsReplace specific errors', () => {
            const error1 = createFileOperationError(new Error('Diffs must not be empty'))
            expect(error1).toBeInstanceOf(EmptyDiffsError)

            const error2 = createFileOperationError(
                new Error('The provided path must exist in order to replace contents into it')
            )
            expect(error2).toBeInstanceOf(FileNotExistsError)

            const error3 = createFileOperationError(new Error('No occurrences of "some text" were found'))
            expect(error3).toBeInstanceOf(TextNotFoundError)

            const error4 = createFileOperationError(
                new Error('Multiple occurrences of "some text" were found when only 1 is expected')
            )
            expect(error4).toBeInstanceOf(MultipleMatchesError)
        })

        test('returns generic FileOperationError for unknown errors', () => {
            const unknownError = new Error('Some unknown error occurred')
            const result = createFileOperationError(unknownError)
            expect(result).toBeInstanceOf(FileOperationError)
            expect(result.message).toBe('Some unknown error occurred')
            expect(result.customerMessage).toBe('Some unknown error occurred')
        })
    })

    describe('getCustomerFacingErrorMessage', () => {
        test('returns customer message from FileOperationError', () => {
            const error = new EmptyPathError()
            expect(getCustomerFacingErrorMessage(error)).toBe(
                'The file path cannot be empty. Please provide a valid file path.'
            )
        })

        test('creates and returns customer message from standard Error', () => {
            const error = new Error('ENOENT: no such file or directory')
            expect(getCustomerFacingErrorMessage(error)).toBe(
                'The directory does not exist. Please create the directory first.'
            )
        })

        test('handles non-Error objects', () => {
            expect(getCustomerFacingErrorMessage('string error')).toBe('string error')
            expect(getCustomerFacingErrorMessage(null)).toBe('null')
            expect(getCustomerFacingErrorMessage(undefined)).toBe('undefined')
        })
    })
})
