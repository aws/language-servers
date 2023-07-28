import * as crypto from 'crypto'
import { CancellationToken, Connection } from 'vscode-languageserver'
import { AwsInitializationOptions } from '../initialization/awsInitializationOptions'
import { CredentialsProvider, IamCredentials, credentialsProtocolMethodNames } from './credentialsProvider'
import { NoCredentialsError } from './error/noCredentialsError'
import { UpdateCredentialsRequest } from './updateCredentialsRequest'

/**
 * Receives credentials from IDE extensions, and decrypts them for use by language server components.
 *
 * PROOF OF CONCEPT: Browser hosts might have a more simplified provider, assuming they already have credentials available.
 */
export class IdeCredentialsProvider implements CredentialsProvider {
    private key: Buffer | undefined
    private pushedCredentials: IamCredentials | undefined

    constructor(private readonly connection: Connection, key?: string) {
        if (key) {
            this.key = Buffer.from(key, 'base64')
            this.connection.console.info('Server: I was initialized with an encryption key')
        } else {
            this.connection.console.info("Server: I didn't get an encryption key. Functionality will be limited.")
        }
    }

    /**
     * Intended to be called when the language server is initialized.
     * If the client provides credentials, handlers are registered.
     */
    public initialize(props: AwsInitializationOptions) {
        this.registerCredentialsPushHandlers(props)
    }

    private async registerCredentialsPushHandlers(props: AwsInitializationOptions) {
        if (props.credentials?.providesIam) {
            this.registerIamCredentialsPushHandlers()
        }

        if (props.credentials?.providesBearerToken) {
            this.connection.console.info('Server: (stub) Registering bearer token credentials push handlers')
            // TODO : Set up Bearer token handlers
        }
    }

    private registerIamCredentialsPushHandlers(): void {
        this.connection.console.info('Server: Registering IAM credentials push handlers')

        // Handle when host sends us credentials to use
        this.connection.onNotification(
            credentialsProtocolMethodNames.iamCredentialsUpdate,
            (request: UpdateCredentialsRequest) => {
                const requestData = this.decryptUpdateCredentialsRequestData(request)
                this.pushedCredentials = JSON.parse(requestData) as IamCredentials
                this.connection.console.info('Server: The language server received updated credentials data.')
            }
        )

        // Handle when host tells us we have no credentials to use
        this.connection.onNotification(credentialsProtocolMethodNames.iamCredentialsDelete, () => {
            this.pushedCredentials = undefined
            this.connection.console.info('Server: The language server does not have credentials anymore.')
        })
    }

    /**
     * Provides IAM based credentials. Throws NoCredentialsError if no credentials are available
     */
    public async resolveIamCredentials(token: CancellationToken): Promise<IamCredentials> {
        if (!this.pushedCredentials) {
            throw new NoCredentialsError()
        }

        return this.pushedCredentials
    }

    private decryptUpdateCredentialsRequestData(request: UpdateCredentialsRequest): string {
        if (!this.key) {
            throw new Error('no encryption key')
        }

        const iv = Buffer.from(request.iv, 'base64')
        const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv, {
            authTagLength: 16,
        })
        decipher.setAuthTag(Buffer.from(request.authTag, 'base64'))

        return decipher.update(request.data, 'base64', 'utf8') + decipher.final('utf8')
    }
}
