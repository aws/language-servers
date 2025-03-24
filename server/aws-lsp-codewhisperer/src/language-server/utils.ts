import { BearerCredentials, CredentialsProvider, Position } from '@aws/language-server-runtimes/server-interface'
import { AWSError } from 'aws-sdk'
import { distance } from 'fastest-levenshtein'
import { Suggestion } from './codeWhispererService'
import { CodewhispererCompletionType } from './telemetry/types'
import { BUILDER_ID_START_URL, MISSING_BEARER_TOKEN_ERROR } from './constants'
export type SsoConnectionType = 'builderId' | 'identityCenter' | 'none'

export function isAwsError(error: unknown): error is AWSError {
    if (error === undefined) {
        return false
    }

    return error instanceof Error && hasCode(error) && hasTime(error)
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
    if (error instanceof Error) {
        return error.message
    }
    return String(error)
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
