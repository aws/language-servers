import { CancellationToken } from 'vscode-languageserver'

export interface IamCredentials {
    accessKeyId: string
    secretAccessKey: string
    sessionToken?: string
    expiration?: Date // v3 format
}

export interface BearerToken {
    token: string
}

export const credentialsProtocolMethodNames = {
    /**
     * Called by host to push new IAM credentials whenever credentials state changes
     * (and there are valid credentials)
     */
    iamCredentialsUpdate: 'aws/credentials/iam/update',
    /**
     * Called by host to un-set any stored IAM credentials
     */
    iamCredentialsDelete: 'aws/credentials/iam/delete',
    /**
     * Called by host to push a new bearer token whenever credentials state changes
     * (and there is a valid token)
     */
    iamBearerTokenUpdate: 'aws/credentials/token/update',
    /**
     * Called by host to un-set any stored bearer token
     */
    iamBearerTokenDelete: 'aws/credentials/token/delete',
    /**
     * Called by host to push new IAM credentials whenever credentials state changes for Atx
     * (and there are valid credentials)
     */
    iamAtxCredentialsUpdate: 'aws/credentials/iam/atxupdate',
    /**
     * Called by host to un-set any stored IAM credentials for Atx
     */
    iamAtxCredentialsDelete: 'aws/credentials/iam/atxdelete',
    /**
     * Called by host to push a new bearer token whenever credentials state changes for Atx
     * (and there is a valid token)
     */
    iamAtxBearerTokenUpdate: 'aws/credentials/token/atxupdate',
    /**
     * Called by host to un-set any stored bearer token for Atx
     */
    iamAtxBearerTokenDelete: 'aws/credentials/token/atxdelete',
}

/**
 * Provides components with an encapsulation request credentials from the host
 */
export interface CredentialsProvider {
    resolveIamCredentials(token: CancellationToken): Promise<IamCredentials>
    resolveBearerToken(token: CancellationToken): Promise<BearerToken>
}
