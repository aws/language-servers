import { BearerCredentials, CredentialsProvider } from '@aws/language-server-runtimes/server-interface'
import { AWSError } from 'aws-sdk'
import { Suggestion } from './codeWhispererService'
import { CodewhispererCompletionType } from './telemetry/types'

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
        throw new Error('credentialsProvider does not have bearer token credentials')
    }

    const credentials = credentialsProvider.getCredentials('bearer') as BearerCredentials

    if (!credentials.token) {
        throw new Error('credentialsProvider does not have bearer token credentials')
    }

    return credentials.token
}
