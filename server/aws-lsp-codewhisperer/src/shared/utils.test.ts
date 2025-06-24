import {
    ServiceQuotaExceededException,
    ThrottlingException,
    ThrottlingExceptionReason,
} from '@aws/codewhisperer-streaming-client'
import { CredentialsProvider, Position } from '@aws/language-server-runtimes/server-interface'
import * as assert from 'assert'
import { AWSError } from 'aws-sdk'
import { expect } from 'chai'
import * as sinon from 'sinon'
import * as os from 'os'
import * as path from 'path'
import { BUILDER_ID_START_URL } from './constants'
import {
    getBearerTokenFromProvider,
    getEndPositionForAcceptedSuggestion,
    getSsoConnectionType,
    getUnmodifiedAcceptedTokens,
    isAwsThrottlingError,
    isUsageLimitError,
    isQuotaExceededError,
    isStringOrNull,
    safeGet,
    getFileExtensionName,
    listFilesWithGitignore,
} from './utils'
import { promises as fsPromises } from 'fs'

describe('getBearerTokenFromProvider', () => {
    const mockToken = 'mockToken'
    it('returns the bearer token from the provider', () => {
        const mockCredentialsProvider: CredentialsProvider = {
            hasCredentials: sinon.stub().returns(true),
            getCredentials: sinon.stub().returns({ token: mockToken }),
            getConnectionMetadata: sinon.stub(),
            getConnectionType: sinon.stub(),
            onCredentialsDeleted: sinon.stub(),
        }
        assert.strictEqual(getBearerTokenFromProvider(mockCredentialsProvider), mockToken)
    })

    it('throws an error if the credentials does not contain bearer credentials', () => {
        const mockCredentialsProvider: CredentialsProvider = {
            hasCredentials: sinon.stub().returns(false),
            getCredentials: sinon.stub().returns({ token: mockToken }),
            getConnectionMetadata: sinon.stub(),
            getConnectionType: sinon.stub(),
            onCredentialsDeleted: sinon.stub(),
        }
        assert.throws(
            () => getBearerTokenFromProvider(mockCredentialsProvider),
            Error,
            'credentialsProvider does not have bearer token credentials'
        )
    })

    it('throws an error if token is empty in bearer token', () => {
        const mockCredentialsProvider: CredentialsProvider = {
            hasCredentials: sinon.stub().returns(true),
            getCredentials: sinon.stub().returns({ token: '' }),
            getConnectionMetadata: sinon.stub(),
            getConnectionType: sinon.stub(),
            onCredentialsDeleted: sinon.stub(),
        }
        assert.throws(
            () => getBearerTokenFromProvider(mockCredentialsProvider),
            Error,
            'credentialsProvider does not have bearer token credentials'
        )
    })
})

describe('getSsoConnectionType', () => {
    const mockToken = 'mockToken'
    const mockCredsProvider: CredentialsProvider = {
        hasCredentials: sinon.stub().returns(true),
        getCredentials: sinon.stub().returns({ token: mockToken }),
        getConnectionMetadata: sinon.stub(),
        getConnectionType: sinon.stub(),
        onCredentialsDeleted: sinon.stub(),
    }
    it('should return ssoConnectionType as builderId', () => {
        const mockCredentialsProvider: CredentialsProvider = {
            hasCredentials: sinon.stub().returns(true),
            getCredentials: sinon.stub().returns({ token: 'token' }),
            getConnectionMetadata: sinon.stub().returns({
                sso: {
                    startUrl: BUILDER_ID_START_URL,
                },
            }),
            getConnectionType: sinon.stub(),
            onCredentialsDeleted: sinon.stub(),
        }
        const ssoConnectionType = getSsoConnectionType(mockCredentialsProvider)
        expect(ssoConnectionType).to.equal('builderId')
    })

    it('should return ssoConnectionType as identityCenter', () => {
        const mockCredentialsProvider: CredentialsProvider = {
            hasCredentials: sinon.stub().returns(true),
            getCredentials: sinon.stub().returns({ token: 'token' }),
            getConnectionMetadata: sinon.stub().returns({
                sso: {
                    startUrl: 'idc-url',
                },
            }),
            getConnectionType: sinon.stub(),
            onCredentialsDeleted: sinon.stub(),
        }
        const ssoConnectionType = getSsoConnectionType(mockCredentialsProvider)
        expect(ssoConnectionType).to.equal('identityCenter')
    })

    it('should return ssoConnectionType as none when getConnectionMetadata returns undefined', () => {
        const ssoConnectionType = getSsoConnectionType(mockCredsProvider)
        expect(ssoConnectionType).to.equal('none')
    })

    it('should return ssoConnectionType as none when getConnectionMetadata.sso returns undefined', () => {
        const mockCredentialsProvider: CredentialsProvider = {
            hasCredentials: sinon.stub().returns(true),
            getCredentials: sinon.stub().returns({ token: 'token' }),
            getConnectionMetadata: sinon.stub().returns({
                sso: undefined,
            }),
            getConnectionType: sinon.stub(),
            onCredentialsDeleted: sinon.stub(),
        }
        const ssoConnectionType = getSsoConnectionType(mockCredentialsProvider)
        expect(ssoConnectionType).to.equal('none')
    })

    it('should return ssoConnectionType as none when getConnectionMetadata.sso.startUrl is empty string', () => {
        const mockCredentialsProvider: CredentialsProvider = {
            hasCredentials: sinon.stub().returns(true),
            getCredentials: sinon.stub().returns({ token: 'token' }),
            getConnectionMetadata: sinon.stub().returns({
                sso: {
                    startUrl: '',
                },
            }),
            getConnectionType: sinon.stub(),
            onCredentialsDeleted: sinon.stub(),
        }
        const ssoConnectionType = getSsoConnectionType(mockCredentialsProvider)
        expect(ssoConnectionType).to.equal('none')
    })

    it('should return ssoConnectionType as none when getConnectionMetadata.sso.startUrl returns undefined', () => {
        const mockCredentialsProvider: CredentialsProvider = {
            hasCredentials: sinon.stub().returns(true),
            getCredentials: sinon.stub().returns({ token: 'token' }),
            getConnectionMetadata: sinon.stub().returns({
                sso: {
                    startUrl: undefined,
                },
            }),
            getConnectionType: sinon.stub(),
            onCredentialsDeleted: sinon.stub(),
        }
        const ssoConnectionType = getSsoConnectionType(mockCredentialsProvider)
        expect(ssoConnectionType).to.equal('none')
    })
})

describe('getUnmodifiedAcceptedTokens', function () {
    it('Should return correct unmodified accepted tokens count', function () {
        assert.strictEqual(getUnmodifiedAcceptedTokens('foo', 'fou'), 2)
        assert.strictEqual(getUnmodifiedAcceptedTokens('foo', 'f11111oo'), 3)
        assert.strictEqual(getUnmodifiedAcceptedTokens('foo', 'fo'), 2)
        assert.strictEqual(getUnmodifiedAcceptedTokens('helloworld', 'HelloWorld'), 8)
        assert.strictEqual(getUnmodifiedAcceptedTokens('helloworld', 'World'), 4)
        assert.strictEqual(getUnmodifiedAcceptedTokens('CodeWhisperer', 'CODE'), 1)
        assert.strictEqual(getUnmodifiedAcceptedTokens('CodeWhisperer', 'CodeWhispererGood'), 13)
    })
})

describe('getEndPositionForAcceptedSuggestion', () => {
    it('should return correct end position for single-line content', () => {
        const content = 'console.log("Hello");'
        const startPosition: Position = { line: 5, character: 10 }

        const result = getEndPositionForAcceptedSuggestion(content, startPosition)

        assert.deepStrictEqual(result, { line: 5, character: 31 })
    })

    it('should return correct end position for multi-line content', () => {
        const content = 'if (condition) {\n  console.log("True");\n}'
        const startPosition: Position = { line: 10, character: 5 }

        const result = getEndPositionForAcceptedSuggestion(content, startPosition)

        assert.deepStrictEqual(result, { line: 12, character: 1 })
    })

    it('should handle empty content', () => {
        const content = ''
        const startPosition: Position = { line: 0, character: 0 }

        const result = getEndPositionForAcceptedSuggestion(content, startPosition)

        assert.deepStrictEqual(result, { line: 0, character: 0 })
    })

    it('should handle content with only newlines', () => {
        const content = '\n\n'
        const startPosition: Position = { line: 3, character: 0 }

        const result = getEndPositionForAcceptedSuggestion(content, startPosition)

        assert.deepStrictEqual(result, { line: 5, character: 0 })
    })

    it('should handle content ending with a newline', () => {
        const content = 'console.log("Hello");\n'
        const startPosition: Position = { line: 7, character: 2 }

        const result = getEndPositionForAcceptedSuggestion(content, startPosition)

        assert.deepStrictEqual(result, { line: 8, character: 0 })
    })
})

describe('safeGet', () => {
    const getStringOrUndefined = (defined: boolean) => {
        return defined ? 'some-string' : undefined
    }

    it('does not throw if argument is defined', () => {
        assert.doesNotThrow(() => safeGet(getStringOrUndefined(true)))
    })

    it('throws when argument is undefined', () => {
        assert.throws(() => safeGet(getStringOrUndefined(false)))
    })
})

describe('isStringOrNull', () => {
    const testCases = [
        { input: 0, expected: false },
        { input: false, expected: false },
        { input: [], expected: false },
        { input: {}, expected: false },
        { input: undefined, expected: false },
        { input: 'some-string', expected: true },
        { input: '', expected: true },
        { input: null, expected: true },
    ]

    testCases.forEach(testCase => {
        it(`should return: ${testCase.expected}, when passed: ${JSON.stringify(testCase.input)}`, () => {
            assert(isStringOrNull(testCase.input) === testCase.expected)
        })
    })
})

describe('isAwsThrottlingError', function () {
    it('false for non-error objects', function () {
        assert.strictEqual(isAwsThrottlingError(undefined), false)
        assert.strictEqual(isAwsThrottlingError(null), false)
        assert.strictEqual(isAwsThrottlingError('error string'), false)
        assert.strictEqual(isAwsThrottlingError({}), false)
        assert.strictEqual(isAwsThrottlingError(42), false)
    })

    it('false for regular Error objects', function () {
        const regularError = new Error('Some error')
        assert.strictEqual(isAwsThrottlingError(regularError), false)
    })

    it('false for non-throttling AWS errors', function () {
        const nonThrottlingError = {
            name: 'AWSError',
            message: 'Not a throttling error',
            code: 'SomeOtherError',
            time: new Date(),
        } as AWSError

        assert.strictEqual(isAwsThrottlingError(nonThrottlingError), false)
    })

    it('true for AWS throttling errors', function () {
        const sdkV2Error = new Error()
        ;(sdkV2Error as any).name = 'ThrottlingException'
        ;(sdkV2Error as any).message = 'Rate exceeded'
        ;(sdkV2Error as any).code = 'ThrottlingException'
        ;(sdkV2Error as any).time = new Date()
        assert.strictEqual(isAwsThrottlingError(sdkV2Error), true)

        const sdkV3Error = new ThrottlingException({
            message: 'Too many requests',
            $metadata: {},
        })
        assert.strictEqual(isAwsThrottlingError(sdkV3Error), true)
    })
})

describe('isMonthlyLimitError', function () {
    it('false for non-throttling errors', function () {
        const regularError = new Error('Some error')
        assert.strictEqual(isUsageLimitError(regularError), false)

        const e = new Error()
        ;(e as any).name = 'AWSError'
        ;(e as any).message = 'Not a throttling error'
        ;(e as any).code = 'SomeOtherError'
        ;(e as any).time = new Date()

        assert.strictEqual(isUsageLimitError(e), false)
    })

    it('false for throttling errors without MONTHLY_REQUEST_COUNT reason', function () {
        const throttlingError = new Error()
        ;(throttlingError as any).name = 'ThrottlingException'
        ;(throttlingError as any).message = 'Rate exceeded'
        ;(throttlingError as any).code = 'ThrottlingException'
        ;(throttlingError as any).time = new Date()
        ;(throttlingError as any).reason = 'SOME_OTHER_REASON'

        assert.strictEqual(isUsageLimitError(throttlingError), false)
    })

    it('true for throttling errors with MONTHLY_REQUEST_COUNT reason', function () {
        const usageLimitError = new Error()
        ;(usageLimitError as any).name = 'ThrottlingException'
        ;(usageLimitError as any).message = 'Free tier limit reached'
        ;(usageLimitError as any).code = 'ThrottlingException'
        ;(usageLimitError as any).time = new Date()
        ;(usageLimitError as any).reason = ThrottlingExceptionReason.MONTHLY_REQUEST_COUNT

        assert.strictEqual(isUsageLimitError(usageLimitError), true)
    })
})

describe('isQuotaExceededError', function () {
    it('false for non-AWS errors', function () {
        const regularError = new Error('Some error')
        assert.strictEqual(isQuotaExceededError(regularError), false)

        assert.strictEqual(isQuotaExceededError(undefined), false)
        assert.strictEqual(isQuotaExceededError(null), false)
        assert.strictEqual(isQuotaExceededError('error string'), false)
    })

    it('true for free tier limit errors', function () {
        const e = new ThrottlingException({
            message: 'Free tier limit reached',
            $metadata: {},
        })

        assert.strictEqual(isQuotaExceededError(e), true)
    })

    it('true for ServiceQuotaExceededException errors', function () {
        const e = new ServiceQuotaExceededException({
            message: 'Service quota exceeded',
            $metadata: {},
        })

        assert.strictEqual(isQuotaExceededError(e), true)
    })

    it('true for specific messages', function () {
        const reachedForThisMonth = new Error()
        ;(reachedForThisMonth as any).name = 'ThrottlingException'
        ;(reachedForThisMonth as any).message = 'You have reached the limit for this month'
        ;(reachedForThisMonth as any).code = 'ThrottlingException'
        ;(reachedForThisMonth as any).time = new Date()

        const limitForIterationsError = new ThrottlingException({
            message: 'You have reached the limit for number of iterations',
            $metadata: {},
        })

        assert.strictEqual(isQuotaExceededError(reachedForThisMonth), true)
        assert.strictEqual(isQuotaExceededError(limitForIterationsError), true)

        // Invalid cases
        reachedForThisMonth.message = 'some other messsage'
        assert.strictEqual(isQuotaExceededError(reachedForThisMonth), false)
        limitForIterationsError.message = 'foo bar'
        assert.strictEqual(isQuotaExceededError(limitForIterationsError), false)
    })
})

describe('getFileExtensionName', () => {
    it('should return empty string for null or undefined input', () => {
        assert.strictEqual(getFileExtensionName(null as unknown as string), '')
        assert.strictEqual(getFileExtensionName(undefined as unknown as string), '')
    })

    it('should return empty string for empty input', () => {
        assert.strictEqual(getFileExtensionName(''), '')
    })

    it('should return empty string when no dots are present', () => {
        assert.strictEqual(getFileExtensionName('filename'), '')
        assert.strictEqual(getFileExtensionName('path/to/file'), '')
    })

    it('should return empty string when file ends with a dot', () => {
        assert.strictEqual(getFileExtensionName('file.'), '')
        assert.strictEqual(getFileExtensionName('path/to/file.'), '')
    })

    it('should return empty string for hidden files without extensions', () => {
        assert.strictEqual(getFileExtensionName('.gitignore'), '')
        assert.strictEqual(getFileExtensionName('.env'), '')
    })

    it('should return extension in lowercase for regular files', () => {
        assert.strictEqual(getFileExtensionName('file.txt'), 'txt')
        assert.strictEqual(getFileExtensionName('file.TXT'), 'txt')
        assert.strictEqual(getFileExtensionName('file.Txt'), 'txt')
    })

    it('should return the last extension for files with multiple dots', () => {
        assert.strictEqual(getFileExtensionName('file.tar.gz'), 'gz')
        assert.strictEqual(getFileExtensionName('archive.TAR.GZ'), 'gz')
    })

    it('should handle paths with directories correctly', () => {
        assert.strictEqual(getFileExtensionName('/path/to/file.pdf'), 'pdf')
        assert.strictEqual(getFileExtensionName('C:\\path\\to\\file.PDF'), 'pdf')
        assert.strictEqual(getFileExtensionName('./relative/path/file.docx'), 'docx')
    })

    it('should return extension for hidden files with extensions', () => {
        assert.strictEqual(getFileExtensionName('.config.json'), 'json')
        assert.strictEqual(getFileExtensionName('.bashrc.bak'), 'bak')
    })
})

describe('listFilesWithGitignore', () => {
    let tempDir: string

    // Helper function to create test files and directories
    async function createTestFiles(structure: { [key: string]: string | null }) {
        for (const [filePath, content] of Object.entries(structure)) {
            const fullPath = path.join(tempDir, filePath)
            const dir = path.dirname(fullPath)

            await fsPromises.mkdir(dir, { recursive: true })

            if (content !== null) {
                await fsPromises.writeFile(fullPath, content || '')
            }
        }
    }

    beforeEach(async () => {
        // Create a temporary directory for each test
        tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'test-'))
    })

    afterEach(async () => {
        // Clean up temporary directory after each test
        await fsPromises.rm(tempDir, { recursive: true, force: true })
    })

    it('should return empty array for empty directory', async () => {
        const files = await listFilesWithGitignore(tempDir)
        assert.deepStrictEqual(files, [])
    })

    it('should return all files when no ignore files present', async () => {
        await createTestFiles({
            'file1.txt': 'content1',
            'file2.js': 'content2',
            'dir/file3.txt': 'content3',
        })

        const files = await listFilesWithGitignore(tempDir)
        const expectedFiles = [
            path.join(tempDir, 'file1.txt'),
            path.join(tempDir, 'file2.js'),
            path.join(tempDir, 'dir/file3.txt'),
        ].sort()

        assert.deepStrictEqual(files.sort(), expectedFiles)
    })

    it('should respect .gitignore patterns', async () => {
        await createTestFiles({
            '.gitignore': '*.txt\nnode_modules/',
            'file1.txt': 'ignored',
            'file2.js': 'not ignored',
            'node_modules/package.json': 'ignored',
            'src/file3.txt': 'ignored',
            'src/file4.js': 'not ignored',
        })

        const files = await listFilesWithGitignore(tempDir)
        const expectedFiles = [
            path.join(tempDir, '.gitignore'),
            path.join(tempDir, 'file2.js'),
            path.join(tempDir, 'src/file4.js'),
        ].sort()

        assert.deepStrictEqual(files.sort(), expectedFiles)
    })

    it('should respect patterns in common gitignore', async () => {
        await createTestFiles({
            'file1.txt': 'not ignored',
            'file2.js': 'not ignored',
            'node_modules/package.json': 'ignored',
            '.idea/file3.txt': 'ignored',
            'src/file4.js': 'not ignored',
        })

        const files = await listFilesWithGitignore(tempDir)
        const expectedFiles = [
            path.join(tempDir, 'file1.txt'),
            path.join(tempDir, 'file2.js'),
            path.join(tempDir, 'src/file4.js'),
        ].sort()

        assert.deepStrictEqual(files.sort(), expectedFiles)
    })

    it('should respect .npmignore patterns', async () => {
        await createTestFiles({
            '.npmignore': '*.test.js\ntests/',
            'file1.js': 'not ignored',
            'file1.test.js': 'ignored',
            'tests/test.js': 'ignored',
        })

        const files = await listFilesWithGitignore(tempDir)
        const expectedFiles = [path.join(tempDir, '.npmignore'), path.join(tempDir, 'file1.js')].sort()

        assert.deepStrictEqual(files.sort(), expectedFiles)
    })

    it('should respect custom .ignorefile patterns', async () => {
        await createTestFiles({
            '.ignorefile': '*.log\nlogs/',
            'app.log': 'ignored',
            'logs/error.log': 'ignored',
            'src/app.js': 'not ignored',
        })

        const files = await listFilesWithGitignore(tempDir)
        const expectedFiles = [path.join(tempDir, '.ignorefile'), path.join(tempDir, 'src/app.js')].sort()

        assert.deepStrictEqual(files.sort(), expectedFiles)
    })

    it('should handle non-existent directory', async () => {
        const nonExistentDir = path.join(tempDir, 'non-existent')
        const files = await listFilesWithGitignore(nonExistentDir)
        assert.deepStrictEqual(files, [])
    })

    it('should handle nested directories and multiple ignore files', async () => {
        await createTestFiles({
            '.gitignore': '*.log',
            'src/.npmignore': 'test/',
            'src/lib/.gitignore': '*.tmp',
            'app.log': 'ignored',
            'src/index.js': 'not ignored',
            'src/test/test.js': 'ignored',
            'src/lib/temp.tmp': 'ignored',
            'src/lib/main.js': 'not ignored',
        })

        const files = await listFilesWithGitignore(tempDir)
        const expectedFiles = [
            path.join(tempDir, '.gitignore'),
            path.join(tempDir, 'src/.npmignore'),
            path.join(tempDir, 'src/lib/.gitignore'),
            path.join(tempDir, 'src/index.js'),
            path.join(tempDir, 'src/lib/main.js'),
        ].sort()

        assert.deepStrictEqual(files.sort(), expectedFiles)
    })

    // Add a hook that runs after all tests in this describe block
    after(() => {
        // Force process to exit after tests complete to prevent hanging
        setTimeout(() => process.exit(0), 1000)
    })
})
