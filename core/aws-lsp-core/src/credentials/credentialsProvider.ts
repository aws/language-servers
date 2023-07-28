import { CancellationToken } from 'vscode-languageserver'

export interface IamCredentials {
    accessKeyId: string
    secretAccessKey: string
    sessionToken?: string
}

export const credentialsProtocolMethodNames = {
    /**
     * Called by host to push new IAM credentials whenever credentials state changes
     * (and there are valid credentials)
     */
    iamCredentialsUpdate: '$/aws/credentials/iam/update',
    /**
     * Called by host to un-set any stored IAM credentials
     */
    iamCredentialsDelete: '$/aws/credentials/iam/delete',
}

/**
 * Provides components with an encapsulation request credentials from the host
 */
export interface CredentialsProvider {
    resolveIamCredentials(token: CancellationToken): Promise<IamCredentials>
    // TODO : establish a bearer token resolver
}
