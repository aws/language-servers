import { UpdateCredentialsParams } from '@aws/language-server-runtimes/protocol'
import * as jose from 'jose'
import { JSONRPCEndpoint } from './lspClient'

/**
 * Encrypts an object using JWT with the provided key.
 * @param request - The object to encrypt
 * @param key - Base64 encoded encryption key
 * @returns Promise resolving to encrypted JWT string
 */
export function encryptObjectWithKey<T>(request: T, key: string): Promise<string> {
    const payload = new TextEncoder().encode(JSON.stringify(request))
    const keyBuffer = Buffer.from(key, 'base64')
    return new jose.CompactEncrypt(payload).setProtectedHeader({ alg: 'dir', enc: 'A256GCM' }).encrypt(keyBuffer)
}

/**
 * Decrypts a JWT string using the provided key.
 * @param request - The encrypted JWT string to decrypt
 * @param key - Base64 encoded decryption key
 * @returns Promise resolving to the decrypted object
 */
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

function getUpdateCredentialsParams(token: string, startUrl: string): UpdateCredentialsParams {
    return {
        data: { token },
        encrypted: false,
        metadata: { sso: { startUrl } },
    }
}

/**
 * Authenticates the server using SSO token and sets the profile.
 * @param endpoint - The JSON-RPC endpoint to authenticate
 * @param ssoToken - The SSO token for authentication
 * @param startUrl - The SSO start URL
 * @param profileArn - The AWS profile ARN to set
 */
export async function authenticateServer(
    endpoint: JSONRPCEndpoint,
    ssoToken: string,
    startUrl: string,
    profileArn: string
): Promise<void> {
    const updateCredentialsParams = getUpdateCredentialsParams(ssoToken, startUrl)
    await updateServerAuthToken(endpoint, updateCredentialsParams)
    await setProfile(endpoint, profileArn)
}

async function updateServerAuthToken(
    endpoint: JSONRPCEndpoint,
    updateCredentialsRequest: UpdateCredentialsParams
): Promise<void> {
    await endpoint.send('aws/credentials/token/update', updateCredentialsRequest)
}

async function setProfile(endpoint: JSONRPCEndpoint, profileArn: string): Promise<void> {
    await endpoint.send('aws/updateConfiguration', {
        section: 'aws.q',
        settings: { profileArn },
    })
}
