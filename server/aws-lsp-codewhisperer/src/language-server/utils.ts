import {
    InitializeParams,
    BearerCredentials,
    CredentialsProvider,
    ConnectionMetadata,
} from '@aws/language-server-runtimes/server-interface'
import { AWSError } from 'aws-sdk'
import { Suggestion } from './codeWhispererService'
import { CodewhispererCompletionType } from './telemetry/types'
import { builderIdStartUrl, MISSING_BEARER_TOKEN_ERROR } from './constants'
import { ServerInfo } from '@aws/language-server-runtimes/server-interface/runtime'
export type LoginType = 'builderId' | 'identityCenter' | 'iam'

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

const USER_AGENT_PREFIX = 'AWS-Language-Servers'
export const getUserAgent = (initializeParams: InitializeParams, serverInfo?: ServerInfo): string => {
    const format = (s: string) => s.replace(/\s/g, '-')

    const items: String[] = []

    items.push(USER_AGENT_PREFIX)

    // Fields specific to runtime artifact
    if (serverInfo?.name) {
        serverInfo.version
            ? items.push(`${format(serverInfo.name)}/${serverInfo.version}`)
            : items.push(format(serverInfo.name))
    }

    // Compute client-specific suffix
    // Missing required data fields are replaced with 'UNKNOWN' token
    // Whitespaces in product.name and platform.name are replaced to '-'
    if (initializeParams?.initializationOptions?.aws) {
        const { clientInfo } = initializeParams?.initializationOptions?.aws
        const { extension } = clientInfo || {}

        if (extension) {
            items.push(`${extension.name ? format(extension.name) : 'UNKNOWN'}/${extension.version || 'UNKNOWN'}`)
        }

        if (clientInfo) {
            items.push(`${clientInfo.name ? format(clientInfo.name) : 'UNKNOWN'}/${clientInfo.version || 'UNKNOWN'}`)
        }

        if (clientInfo?.clientId) {
            items.push(`ClientId/${clientInfo?.clientId}`)
        }
    } else {
        // Default to standard InitializeParams.clientInfo if no custom aws.clientInfo is set
        const { clientInfo } = initializeParams || {}
        if (clientInfo) {
            items.push(`${clientInfo.name ? format(clientInfo.name) : 'UNKNOWN'}/${clientInfo.version || 'UNKNOWN'}`)
        }
    }

    return items.join(' ')
}

export function getLoginTypeFromProvider(credentialsProvider: CredentialsProvider): LoginType {
    if (credentialsProvider.hasCredentials('iam')) {
        return 'iam'
    }
    const connectionMetadata = credentialsProvider.getConnectionMetadata()
    return connectionMetadata && connectionMetadata.sso && connectionMetadata.sso.startUrl
        ? connectionMetadata.sso.startUrl.includes(builderIdStartUrl)
            ? 'builderId'
            : 'identityCenter'
        : 'builderId'
}
