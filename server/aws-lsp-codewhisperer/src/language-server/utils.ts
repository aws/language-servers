import { BearerCredentials, CredentialsProvider } from '@aws/language-server-runtimes/server-interface'
import { AWSError } from 'aws-sdk'
import { Suggestion } from './codeWhispererService'
import { CodewhispererCompletionType } from './telemetry/types'
import { ChatResult } from '@aws/language-server-runtimes/protocol'

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

type AuthFollowUpType = 'full-auth' | 're-auth' | 'missing_scopes' | 'use-supported-auth'

type AUTH_ERROR = { message: string; authFollowType: AuthFollowUpType }

const MISSING_BEARER_TOKEN_ERROR = 'credentialsProvider does not have bearer token credentials'
const TOKEN_EXPIRED_ERROR = 'credentials expired'
// TODO: I am not sure if we should use general 403 error message for this
const MISSING_SCOPE_ERROR = 'User is not authorized to make this call'

const AUTH_ERRORS: AUTH_ERROR[] = [
    {
        message: MISSING_BEARER_TOKEN_ERROR,
        authFollowType: 'full-auth',
    },
    {
        message: TOKEN_EXPIRED_ERROR,
        authFollowType: 're-auth',
    },
    {
        message: MISSING_SCOPE_ERROR,
        authFollowType: 'missing_scopes',
    },
]

export function getAuthError(err: unknown): AUTH_ERROR | undefined {
    return err instanceof Error ? AUTH_ERRORS.find(authError => err.message.startsWith(authError.message)) : undefined
}

export function createAuthFollowUpResult(authType: AuthFollowUpType): ChatResult {
    let pillText
    switch (authType) {
        case 'full-auth':
            pillText = 'Authenticate'
            break
        case 'use-supported-auth':
        case 'missing_scopes':
            pillText = 'Enable Amazon Q'
            break
        case 're-auth':
            pillText = 'Re-authenticate'
            break
    }

    return {
        body: 'Please authenticate',
        followUp: {
            text: '',
            options: [{ pillText, type: authType }],
        },
    }
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
