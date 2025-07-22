import { StsCache } from './stsCache'
import { AwsErrorCodes, IamCredentials } from '@aws/language-server-runtimes/server-interface'
import { AwsError, Observability } from '@aws/lsp-core'
import { throwOnInvalidCredentialId } from '../../iam/utils'

export class RefreshingStsCache implements StsCache {
    constructor(
        private readonly next: StsCache,
        private readonly observability: Observability
    ) {}

    async removeStsCredential(iamCredentialId: string): Promise<void> {
        this.observability.logging.log('Removing STS Credential.')
        throwOnInvalidCredentialId(iamCredentialId)

        await this.next.removeStsCredential(iamCredentialId)
    }

    async getStsCredential(iamCredentialId: string): Promise<IamCredentials | undefined> {
        this.observability.logging.log('Retrieving STS Credential.')

        throwOnInvalidCredentialId(iamCredentialId)

        const credential = await this.next.getStsCredential(iamCredentialId)

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

    async setStsCredential(iamCredentialId: string, credentials: IamCredentials): Promise<void> {
        this.observability.logging.log('Storing STS Credential.')
        await this.next.setStsCredential(iamCredentialId, credentials)
    }
}
