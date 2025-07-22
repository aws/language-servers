import { StsCache } from './stsCache'
import { AwsErrorCodes, IamCredentials } from '@aws/language-server-runtimes/server-interface'
import { AwsError, Observability } from '@aws/lsp-core'

interface StsCredentialDetail {
    lastRefreshMillis: number
}

export class RefreshingStsCache implements StsCache {
    private readonly stsCredentialDetails: Record<string, StsCredentialDetail> = {}

    constructor(
        private readonly next: StsCache,
        private readonly observability: Observability
    ) {}

    async removeStsCredential(name: string): Promise<void> {
        this.observability.logging.log('Removing STS Credential.')
        if (!name.trim()) {
            throw new AwsError('Profile name is invalid.', AwsErrorCodes.E_INVALID_PROFILE)
        }

        await this.next.removeStsCredential(name)
    }

    async getStsCredential(name: string): Promise<IamCredentials | undefined> {
        this.observability.logging.log('Retrieving STS Credential.')

        if (!name.trim()) {
            throw new AwsError('Profile name is invalid.', AwsErrorCodes.E_INVALID_PROFILE)
        }

        const credential = await this.next.getStsCredential(name)

        if (!credential?.expiration) {
            this.observability.logging.log('STS Credential not found.')
            return undefined
        }

        const nowMillis = Date.now()
        const expirationMillis = new Date(credential.expiration).getTime()

        // Check if credential is still valid (not in refresh window)
        if (nowMillis < expirationMillis) {
            this.observability.logging.log(
                'STS credential expiration is before refresh window.  Returning current STS credential.'
            )
            return credential
        } else {
            // Credential is in refresh window or expired
            this.observability.logging.log('STS credential has expired.')
            throw new AwsError('STS credential has expired.', AwsErrorCodes.E_STS_CREDENTIAL_EXPIRED)
        }
    }

    async setStsCredential(name: string, credentials: IamCredentials): Promise<void> {
        this.observability.logging.log('Storing STS Credential.')
        await this.next.setStsCredential(name, credentials)
    }
}
