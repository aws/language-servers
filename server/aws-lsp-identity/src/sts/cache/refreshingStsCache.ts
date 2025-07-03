import { StsCache, StsCredential } from './stsCache'
import { AwsErrorCodes } from '@aws/language-server-runtimes/server-interface'
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

    async getStsCredential(name: string): Promise<StsCredential | undefined> {
        this.observability.logging.log('Retrieving STS Credential.')

        if (!name.trim()) {
            throw new AwsError('Profile name is invalid.', AwsErrorCodes.E_INVALID_PROFILE)
        }

        const stsCredential = await this.next.getStsCredential(name)

        if (!stsCredential || !stsCredential.Credentials?.Expiration) {
            this.observability.logging.log('STS Credential not found.')
            return undefined
        }

        const nowMillis = Date.now()
        const expirationMillis = new Date(stsCredential.Credentials.Expiration).getTime()

        // Check if credential is still valid (not in refresh window)
        if (nowMillis < expirationMillis) {
            this.observability.logging.log('STS credential before refresh window.  Returning current STS credential.')
            return stsCredential
        } else {
            // Credential is in refresh window or expired
            this.observability.logging.log('STS credential has expired.')
            throw new AwsError('STS credential has expired.', AwsErrorCodes.E_STS_CREDENTIAL_EXPIRED)
        }
    }

    async setStsCredential(name: string, credentials: StsCredential): Promise<void> {
        this.observability.logging.log('Storing STS Credential.')
        await this.next.setStsCredential(name, credentials)
    }
}
