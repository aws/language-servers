import {
    AwsResponseError,
    BearerCredentials,
    CredentialsProvider,
    Position,
} from '@aws/language-server-runtimes/server-interface'
import { AWSError, Credentials } from 'aws-sdk'
import { distance } from 'fastest-levenshtein'
import { Suggestion } from './codeWhispererService'
import { CodewhispererCompletionType } from './telemetry/types'
import {
    BUILDER_ID_START_URL,
    COMMON_GITIGNORE_PATTERNS,
    crashMonitoringDirName,
    driveLetterRegex,
    MISSING_BEARER_TOKEN_ERROR,
} from './constants'
import {
    CodeWhispererStreamingServiceException,
    Origin,
    ServiceQuotaExceededException,
    ThrottlingException,
    ThrottlingExceptionReason,
} from '@amzn/codewhisperer-streaming'
import * as path from 'path'
import { ServiceException } from '@smithy/smithy-client'
import { promises as fs } from 'fs'
import * as fg from 'fast-glob'
import { getAuthFollowUpType } from '../language-server/chat/utils'
import ignore = require('ignore')
import { InitializeParams } from '@aws/language-server-runtimes/server-interface'
import { QClientCapabilities } from '../language-server/configuration/qConfigurationServer'
export type SsoConnectionType = 'builderId' | 'identityCenter' | 'none'

export function isAwsError(error: unknown): error is AWSError {
    if (error === undefined) {
        return false
    }

    // TODO: do SDK v3 errors have `.code` ?
    return error instanceof Error && hasCode(error) && hasTime(error)
}

export function isAwsThrottlingError(e: unknown): e is ThrottlingException {
    if (!e) {
        return false
    }

    // Non-AWS HTTP throttling error:
    // const statusCode = getHttpStatusCode(e)
    // if (statusCode === 429 || e.message.includes('Too many requests')) {
    //     return true
    // }

    if (e instanceof ThrottlingException || (isAwsError(e) && e.code === 'ThrottlingException')) {
        return true
    }

    return false
}

/**
 * Special case of throttling error: monthly limit reached. This is most common
 * for "free tier" users, but is technically possible for "pro tier" also.
 *
 * See `client/token/bearer-token-service.json`.
 */
export function isUsageLimitError(e: unknown): e is ThrottlingException {
    if (!e) {
        return false
    }

    if (hasCode(e) && (e.code === 'AmazonQUsageLimitError' || e.code === 'E_AMAZON_Q_USAGE_LIMIT')) {
        return true
    }

    if ((e as Error).name === 'AmazonQUsageLimitError') {
        return true
    }

    if (!isAwsThrottlingError(e)) {
        return false
    }

    if (e.reason == ThrottlingExceptionReason.MONTHLY_REQUEST_COUNT) {
        return true
    }

    return false
}

export function isQuotaExceededError(e: unknown): e is AWSError {
    if (!e) {
        return false
    }

    // From client/token/bearer-token-service.json
    if (isUsageLimitError(e)) {
        return true
    }

    // https://github.com/aws/aws-toolkit-vscode/blob/db673c9b74b36591bb5642b3da7d4bc7ae2afaf4/packages/core/src/amazonqFeatureDev/client/featureDev.ts#L199
    // "Backend service will throw ServiceQuota if code generation iteration limit is reached".
    if (e instanceof ServiceQuotaExceededException || (isAwsError(e) && e.code == 'ServiceQuotaExceededException')) {
        return true
    }

    // https://github.com/aws/aws-toolkit-vscode/blob/db673c9b74b36591bb5642b3da7d4bc7ae2afaf4/packages/core/src/amazonqFeatureDev/client/featureDev.ts#L199
    // "API Front-end will throw Throttling if conversation limit is reached.
    // API Front-end monitors StartCodeGeneration for throttling"
    if (
        isAwsThrottlingError(e) &&
        (e.message.includes('reached for this month') ||
            e.message.includes('limit for this month') ||
            e.message.includes('limit reached') ||
            e.message.includes('limit for number of iterations'))
    ) {
        return true
    }

    return false
}

/**
 * Returns the identifier the given error.
 * Depending on the implementation, the identifier may exist on a
 * different property.
 */
export function getErrorId(error: Error): string {
    // prioritize code over the name
    return hasCode(error) ? error.code : error.name
}

/**
 * Derives an error message from the given error object.
 * Depending on the Error, the property used to derive the message can vary.
 *
 * @param withCause Append the message(s) from the cause chain, recursively.
 *                  The message(s) are delimited by ' | '. Eg: msg1 | causeMsg1 | causeMsg2
 */
export function getErrorMsg(err: Error | undefined, withCause: boolean = false): string | undefined {
    if (err === undefined) {
        return undefined
    }

    // Non-standard SDK fields added by the OIDC service, to conform to the OAuth spec
    // (https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2.1) :
    // - error: code per the OAuth spec
    // - error_description: improved error message provided by OIDC service. Prefer this to
    //   `message` if present.
    //   https://github.com/aws/aws-toolkit-jetbrains/commit/cc9ed87fa9391dd39ac05cbf99b4437112fa3d10
    // - error_uri: not provided by OIDC currently?
    //
    // Example:
    //
    //      [error] API response (oidc.us-east-1.amazonaws.com /token): {
    //        name: 'InvalidGrantException',
    //        '$fault': 'client',
    //        '$metadata': {
    //          httpStatusCode: 400,
    //          requestId: '7f5af448-5af7-45f2-8e47-5808deaea4ab',
    //          extendedRequestId: undefined,
    //          cfId: undefined
    //        },
    //        error: 'invalid_grant',
    //        error_description: 'Invalid refresh token provided',
    //        message: 'UnknownError'
    //      }
    const anyDesc = (err as any).error_description
    const errDesc = typeof anyDesc === 'string' ? anyDesc.trim() : ''
    let msg = errDesc !== '' ? errDesc : err.message?.trim()

    if (typeof msg !== 'string') {
        return undefined
    }

    // append the cause's message
    if (withCause) {
        const errorId = getErrorId(err)
        // - prepend id to message
        // - If a generic error does not have the `name` field explicitly set, it returns a generic 'Error' name. So skip since it is useless.
        if (errorId && errorId !== 'Error') {
            msg = `${errorId}: ${msg}`
        }

        const cause = (err as any).cause
        return `${msg}${cause ? ' | ' + getErrorMsg(cause, withCause) : ''}`
    }

    return msg
}

/**
 * Gets a useful, but not excessive, error message for logs and user messages.
 */
export function fmtError(e: any): string {
    const code = getErrorId(e)
    const requestId = getRequestID(e)
    const msg = getErrorMsg(e as Error)

    return `${code}: "${msg}", requestId: ${requestId}`
}

/**
 * Removes potential PII from a string, for logging/telemetry.
 *
 * Examples:
 * - "Failed to save c:/fooß/bar/baz.txt" => "Failed to save c:/xß/x/x.txt"
 * - "EPERM for dir c:/Users/user1/.aws/sso/cache/abc123.json" => "EPERM for dir c:/Users/x/.aws/sso/cache/x.json"
 */
export function scrubNames(s: string, username?: string) {
    let r = ''
    const fileExtRe = /\.[^.\/]+$/
    const slashdot = /^[~.]*[\/\\]*/

    /** Allowlisted filepath segments. */
    const keep = new Set<string>([
        '~',
        '.',
        '..',
        '.aws',
        'aws',
        'sso',
        'cache',
        'credentials',
        'config',
        'Users',
        'users',
        'home',
        'tmp',
        'aws-toolkit-vscode',
        'globalStorage', // from vscode globalStorageUri
        crashMonitoringDirName,
    ])

    if (username && username.length > 2) {
        s = s.replaceAll(username, 'x')
    }

    // Replace contiguous whitespace with 1 space.
    s = s.replace(/\s+/g, ' ')

    // 1. split on whitespace.
    // 2. scrub words that match username or look like filepaths.
    const words = s.split(/\s+/)
    for (const word of words) {
        const pathSegments = word.split(/[\/\\]/)
        if (pathSegments.length < 2) {
            // Not a filepath.
            r += ' ' + word
            continue
        }

        // Replace all (non-allowlisted) ASCII filepath segments with "x".
        // "/foo/bar/aws/sso/" => "/x/x/aws/sso/"
        let scrubbed = ''
        // Get the frontmatter ("/", "../", "~/", or "./").
        const start = word.trimStart().match(slashdot)?.[0] ?? ''
        pathSegments[0] = pathSegments[0].trimStart().replace(slashdot, '')
        for (const seg of pathSegments) {
            if (driveLetterRegex.test(seg)) {
                scrubbed += seg
            } else if (keep.has(seg)) {
                scrubbed += '/' + seg
            } else {
                // Save the first non-ASCII (unicode) char, if any.
                const nonAscii = seg.match(/[^\p{ASCII}]/u)?.[0] ?? ''
                // Replace all chars (except [^…]) with "x" .
                const ascii = seg.replace(/[^$[\](){}:;'" ]+/g, 'x')
                scrubbed += `/${ascii}${nonAscii}`
            }
        }

        // includes leading '.', eg: '.json'
        const fileExt = pathSegments[pathSegments.length - 1].match(fileExtRe) ?? ''
        r += ` ${start.replace(/\\/g, '/')}${scrubbed.replace(/^[\/\\]+/, '')}${fileExt}`
    }

    return r.trim()
}

// Port of implementation in AWS Toolkit for VSCode
// https://github.com/aws/aws-toolkit-vscode/blob/c22efa03e73b241564c8051c35761eb8620edb83/packages/core/src/shared/errors.ts#L455
/**
 * Gets the (partial) error message detail for the `reasonDesc` field.
 *
 * @param err Error object, or message text
 */
export function getTelemetryReasonDesc(err: unknown | undefined): string | undefined {
    const m = typeof err === 'string' ? err : (getErrorMsg(err as Error, true) ?? '')
    const msg = scrubNames(m)

    // Truncate message as these strings can be very long.
    return msg && msg.length > 0 ? msg.substring(0, 350) : undefined
}

function hasCode<T>(error: T): error is T & { code: string } {
    return typeof (error as { code?: unknown }).code === 'string'
}

function hasTime(error: Error): error is typeof error & { time: Date } {
    return (error as { time?: unknown }).time instanceof Date
}

export function isObject(value: unknown): value is { [key: number | string | symbol]: any } {
    return Boolean(value) && typeof value === 'object'
}

export function isNullish(value: unknown): value is null | undefined {
    return value === null || value === undefined
}

export function isBool(value: unknown): value is boolean {
    return typeof value === 'boolean'
}

export function getCompletionType(suggestion: Suggestion): CodewhispererCompletionType {
    const nonBlankLines = suggestion.content.split('\n').filter(line => line.trim() !== '').length

    return nonBlankLines > 1 ? 'Block' : 'Line'
}

export function enabledModelSelection(params: InitializeParams | undefined): boolean {
    const qCapabilities = params?.initializationOptions?.aws?.awsClientCapabilities?.q as
        | QClientCapabilities
        | undefined
    return qCapabilities?.modelSelection || false
}

export function parseJson(jsonString: string) {
    try {
        return JSON.parse(jsonString)
    } catch {
        throw new Error(`error while parsing string: ${jsonString}`)
    }
}

/** @deprecated Use `getErrorMsg()` instead. */
export function getErrorMessage(error: any): string {
    if (error?.cause?.message) {
        return error?.cause?.message
    } else if (error instanceof Error) {
        return error.message
    }
    return String(error)
}

export function getRequestID(error: any): string | undefined {
    if (hasCause(error) && error.cause.$metadata?.requestId) {
        return error.cause.$metadata.requestId
    }
    if (typeof error.requestId === 'string') {
        return error.requestId
    }
    if (error instanceof CodeWhispererStreamingServiceException) {
        return error.$metadata.requestId
    }

    return undefined
}

export function getBearerTokenFromProvider(credentialsProvider: CredentialsProvider) {
    if (!credentialsProvider.hasCredentials('bearer')) {
        throw new Error(MISSING_BEARER_TOKEN_ERROR)
    }

    const credentials = credentialsProvider.getCredentials('bearer') as BearerCredentials

    if (!credentials.token) {
        throw new Error(MISSING_BEARER_TOKEN_ERROR)
    }

    return credentials.token
}

export function getOriginFromClientInfo(clientName: string | undefined): Origin {
    if (clientName?.startsWith('AmazonQ-For-SMUS-IDE')) {
        return 'MD_IDE'
    }
    return 'IDE'
}

export function isUsingIAMAuth(): boolean {
    return process.env.USE_IAM_AUTH === 'true'
}

export const flattenMetric = (obj: any, prefix = '') => {
    const flattened: any = {}

    Object.keys(obj).forEach(key => {
        const value = obj[key]

        if (prefix !== '') {
            key = '_' + key
        }

        if (typeof value === 'object' && value !== null) {
            Object.assign(flattened, flattenMetric(value, prefix + key))
        } else {
            flattened[prefix + key] = value
        }
    })

    return flattened
}

export function getSsoConnectionType(credentialsProvider: CredentialsProvider): SsoConnectionType {
    const connectionMetadata = credentialsProvider.getConnectionMetadata()
    const startUrl = connectionMetadata?.sso?.startUrl
    return !startUrl ? 'none' : startUrl.includes(BUILDER_ID_START_URL) ? 'builderId' : 'identityCenter'
}

// Port of implementation in AWS Toolkit for VSCode
// https://github.com/aws/aws-toolkit-vscode/blob/master/packages/core/src/codewhisperer/util/commonUtil.ts#L81C1-L88C2
// With edit distance, complicate usermodification can be considered as simple edit(add, delete, replace),
// and thus the unmodified part of recommendation length can be deducted/approximated
// ex. (modified > original): originalRecom: foo -> modifiedRecom: fobarbarbaro, distance = 9, delta = 12 - 9 = 3
// ex. (modified == original): originalRecom: helloworld -> modifiedRecom: HelloWorld, distance = 2, delta = 10 - 2 = 8
// ex. (modified < original): originalRecom: CodeWhisperer -> modifiedRecom: CODE, distance = 12, delta = 13 - 12 = 1
export function getUnmodifiedAcceptedTokens(origin: string, after: string) {
    return Math.max(origin.length, after.length) - distance(origin, after)
}

export function getEndPositionForAcceptedSuggestion(content: string, startPosition: Position): Position {
    const insertedLines = content.split('\n')
    const numberOfInsertedLines = insertedLines.length

    // Calculate the new cursor position
    let endPosition
    if (numberOfInsertedLines === 1) {
        // If single line, add the length of the inserted code to the character
        endPosition = {
            line: startPosition.line,
            character: startPosition.character + content.length,
        }
    } else {
        // If multiple lines, set the cursor to the end of the last inserted line
        endPosition = {
            line: startPosition.line + numberOfInsertedLines - 1,
            character: insertedLines[numberOfInsertedLines - 1].length,
        }
    }
    return endPosition
}

export function safeGet<T, E extends Error>(object: T | undefined, customError?: E): T {
    if (object === undefined) {
        throw customError ?? new Error(`Expected object: "${String(object)} to be defined, but found undefined`)
    }

    return object
}

export function isStringOrNull(object: any): object is string | null {
    return typeof object === 'string' || object === null
}

// Port of implementation in AWS Toolkit for VSCode
// https://github.com/aws/aws-toolkit-vscode/blob/c22efa03e73b241564c8051c35761eb8620edb83/packages/core/src/shared/errors.ts#L648
export function getHttpStatusCode(err: unknown): number | undefined {
    // RTS throws validation errors with a 400 status code to LSP, we convert them to 500 from the perspective of the user

    if (hasResponse(err) && err?.$response?.statusCode !== undefined) {
        return err?.$response?.statusCode
    }
    if (hasMetadata(err) && err.$metadata?.httpStatusCode !== undefined) {
        return err.$metadata?.httpStatusCode
    }
    if (hasCause(err) && err.cause.$metadata?.httpStatusCode !== undefined) {
        return err.cause.$metadata.httpStatusCode
    }

    return undefined
}

function hasResponse<T>(error: T): error is T & Pick<ServiceException, '$response'> {
    return typeof (error as { $response?: unknown })?.$response === 'object'
}

function hasMetadata<T>(error: T): error is T & Pick<CodeWhispererStreamingServiceException, '$metadata'> {
    return typeof (error as { $metadata?: unknown })?.$metadata === 'object'
}

function hasCause<T>(error: T): error is T & { cause: { $metadata?: { httpStatusCode?: number } } } {
    return typeof (error as { cause?: unknown })?.cause === 'object'
}

export function hasConnectionExpired(error: any) {
    if (error instanceof Error) {
        const authFollowType = getAuthFollowUpType(error)
        return authFollowType == 're-auth'
    }
    return false
}

/**
  Lists files in a directory respecting gitignore and npmignore rules.
  @param directory The absolute path of root directory.
  @returns A promise that resolves to an array of absolute file paths.
 */
export async function listFilesWithGitignore(directory: string): Promise<string[]> {
    let ignorePatterns: string[] = [...COMMON_GITIGNORE_PATTERNS]

    // Process .gitignore
    const gitignorePath = path.join(directory, '.gitignore')
    try {
        const gitignoreContent = await fs.readFile(gitignorePath, { encoding: 'utf8' })
        ignorePatterns = ignorePatterns.concat(
            gitignoreContent
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#'))
        )
    } catch (err: any) {
        if (err.code !== 'ENOENT') {
            console.log('Preindexing walk: gitIgnore file could not be read', err)
        }
    }

    // Process .npmignore
    const npmignorePath = path.join(directory, '.npmignore')
    try {
        const npmignoreContent = await fs.readFile(npmignorePath, { encoding: 'utf8' })
        ignorePatterns = ignorePatterns.concat(
            npmignoreContent
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#'))
        )
    } catch (err: any) {
        if (err.code !== 'ENOENT') {
            console.log('Preindexing walk: npmIgnore file could not be read', err)
        }
    }

    const absolutePaths: string[] = []
    let fileCount = 0
    const MAX_FILES = 500_000

    const stream = fg.stream(['**/*'], {
        cwd: directory,
        dot: true,
        ignore: ignorePatterns,
        onlyFiles: true,
        followSymbolicLinks: false,
        absolute: true,
    })

    for await (const entry of stream) {
        if (fileCount >= MAX_FILES) {
            break
        }
        absolutePaths.push(entry.toString())
        fileCount++
    }

    return absolutePaths
}

export function getFileExtensionName(filepath: string): string {
    // Handle null/undefined
    if (!filepath) {
        return ''
    }

    // Handle no dots or file ending with dot
    if (!filepath.includes('.') || filepath.endsWith('.')) {
        return ''
    }

    // Handle hidden files (optional, depending on your needs)
    if (filepath.startsWith('.') && filepath.indexOf('.', 1) === -1) {
        return ''
    }

    return filepath.substring(filepath.lastIndexOf('.') + 1).toLowerCase()
}

/**
 * Sanitizes input by removing dangerous Unicode characters that could be used for ASCII smuggling
 * @param input The input string to sanitize
 * @returns The sanitized string with dangerous characters removed
 */
export function sanitizeInput(input: string): string {
    if (!input) {
        return input
    }

    // Remove Unicode tag characters (U+E0000-U+E007F) used in ASCII smuggling
    // Remove other invisible/control characters that could hide content
    return input.replace(
        /[\u{E0000}-\u{E007F}\u{200B}-\u{200F}\u{2028}-\u{202F}\u{205F}-\u{206F}\u{FFF0}-\u{FFFF}]/gu,
        ''
    )
}

/**
 * Recursively sanitizes the entire request input to prevent Unicode ASCII smuggling
 * @param input The request input to sanitize
 * @returns The sanitized request input
 */
export function sanitizeRequestInput(input: any): any {
    if (typeof input === 'string') {
        return sanitizeInput(input)
    }
    if (input instanceof Uint8Array) {
        // Don't sanitize binary data like images - return as-is
        return input
    }
    if (Array.isArray(input)) {
        return input.map(item => sanitizeRequestInput(item))
    }
    if (input && typeof input === 'object') {
        const sanitized: any = {}
        for (const [key, value] of Object.entries(input)) {
            sanitized[key] = sanitizeRequestInput(value)
        }
        return sanitized
    }
    return input
}
