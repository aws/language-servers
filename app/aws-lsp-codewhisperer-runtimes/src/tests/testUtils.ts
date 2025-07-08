import { UpdateCredentialsParams } from '@aws/language-server-runtimes/protocol'
import * as jose from 'jose'
import { JSONRPCEndpoint } from 'ts-lsp-client'

export function encryptObjectWithKey<T>(request: T, key: string): Promise<string> {
    const payload = new TextEncoder().encode(JSON.stringify(request))
    const keyBuffer = Buffer.from(key, 'base64')
    return new jose.CompactEncrypt(payload).setProtectedHeader({ alg: 'dir', enc: 'A256GCM' }).encrypt(keyBuffer)
}

export async function decryptObjectWithKey<T>(request: string, key: string): Promise<T> {
    const result = await jose.jwtDecrypt(request, Buffer.from(key, 'base64'), {
        clockTolerance: 60, // Allow up to 60 seconds to account for clock differences
        contentEncryptionAlgorithms: ['A256GCM'],
        keyManagementAlgorithms: ['dir'],
    })

    if (!result.payload) {
        throw new Error('JWT payload not found')
    }
    return result.payload as T
}

async function getSSOToken(): Promise<UpdateCredentialsParams> {
    const token = process.env.SSO_TOKEN
    if (!token) {
        throw new Error('SSO_TOKEN environment variable is not set')
    }
    return {
        data: { token },
        encrypted: false,
        metadata: { sso: { startUrl: process.env.SSO_START_URL } },
    }
}

export async function authenticateServer(endpoint: JSONRPCEndpoint): Promise<void> {
    const credentials = await getSSOToken()
    await updateServerAuthToken(endpoint, credentials)
    await setProfile(endpoint)
}

async function updateServerAuthToken(
    endpoint: JSONRPCEndpoint,
    updateCredentialsRequest: UpdateCredentialsParams
): Promise<void> {
    await endpoint.send('aws/credentials/token/update', updateCredentialsRequest)
}

export async function setProfile(endpoint: JSONRPCEndpoint): Promise<void> {
    await endpoint.send('aws/updateConfiguration', {
        section: 'aws.q',
        settings: { profileArn: process.env.PROFILE_ARN },
    })
}
