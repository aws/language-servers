import { BearerCredentials, CredentialsProvider, Position } from '@aws/language-server-runtimes/server-interface'
import { AWSError } from 'aws-sdk'
import { distance } from 'fastest-levenshtein'
import { Suggestion } from './codeWhispererService'
import { CodewhispererCompletionType } from './telemetry/types'
import { BUILDER_ID_START_URL, crashMonitoringDirName, driveLetterRegex, MISSING_BEARER_TOKEN_ERROR } from './constants'
import { CodeWhispererStreamingServiceException } from '@aws/codewhisperer-streaming-client'
import { ServiceException } from '@smithy/smithy-client'
import { getAuthFollowUpType } from '../language-server/chat/utils'
export type SsoConnectionType = 'builderId' | 'identityCenter' | 'none'

export function isAwsError(error: unknown): error is AWSError {
    if (error === undefined) {
        return false
    }

    return error instanceof Error && hasCode(error) && hasTime(error)
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

export function parseJson(jsonString: string) {
    try {
        return JSON.parse(jsonString)
    } catch {
        throw new Error(`error while parsing string: ${jsonString}`)
    }
}

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
