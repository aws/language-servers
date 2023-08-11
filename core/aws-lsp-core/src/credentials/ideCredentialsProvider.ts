import { jwtDecrypt } from 'jose'
import { CancellationToken, Connection } from 'vscode-languageserver'
import { AwsInitializationOptions } from '../initialization/awsInitializationOptions'
import { CredentialsProvider, IamCredentials, credentialsProtocolMethodNames } from './credentialsProvider'
import { CredentialsEncoding } from './encryption'
import { NoCredentialsError } from './error/noCredentialsError'
import { UpdateCredentialsRequest } from './updateCredentialsRequest'

/**
 * Receives credentials from IDE extensions, and decrypts them for use by language server components.
 *
 * PROOF OF CONCEPT: Browser hosts might have a more simplified provider, assuming they already have credentials available.
 */
export class IdeCredentialsProvider implements CredentialsProvider {
    private key: Buffer | undefined
    private credentialsEncoding: CredentialsEncoding | undefined
    private pushedCredentials: IamCredentials | undefined

    constructor(private readonly connection: Connection, key?: string, credentialsEncoding?: CredentialsEncoding) {
        this.connection.console.info(`Server: I was initialized with credentials encoding: ${credentialsEncoding}`)
        this.credentialsEncoding = credentialsEncoding
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
            async (request: UpdateCredentialsRequest) => {
                try {
                    const iamCredentials = await this.decodeCredentialsRequestToken<IamCredentials>(request)

                    this.validateIamCredentialsFields(iamCredentials)

                    this.pushedCredentials = iamCredentials
                    this.connection.console.info('Server: The language server received updated credentials data.')
                } catch (error) {
                    this.pushedCredentials = undefined
                    this.connection.console.error(
                        `Server: Failed to set credentials: ${error}. Credentials have been unset.`
                    )
                }
            }
        )

        // Handle when host tells us we have no credentials to use
        this.connection.onNotification(credentialsProtocolMethodNames.iamCredentialsDelete, () => {
            this.pushedCredentials = undefined
            this.connection.console.info('Server: The language server does not have credentials anymore.')
        })
    }

    /**
     * Throws an error if credentials fields are missing
     */
    private validateIamCredentialsFields(credentials: IamCredentials): void {
        // Currently this is a proof of concept
        // TODO : validate that iamCredentials fields are actually set
        if (credentials.accessKeyId === undefined) {
            throw new Error('Missing property: accessKeyId')
        }
        if (credentials.secretAccessKey === undefined) {
            throw new Error('Missing property: secretAccessKey')
        }
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

    private async decodeCredentialsRequestToken<T>(request: UpdateCredentialsRequest): Promise<T> {
        if (!this.key) {
            throw new Error('no encryption key')
        }

        if (this.credentialsEncoding === 'JWT') {
            const result = await jwtDecrypt(request.data, this.key)

            // PROOF OF CONCEPT. Additional validations would normally get added.
            // TODO : validate that result.protectedHeader.alg is 'dir'
            // TODO : validate that result.protectedHeader.enc is 'A256GCM'
            // TODO : validate that result.payload.nbf is before current time
            // TODO : validate that result.payload.exp is after current time
            // TODO : validate that result.payload.data exists

            return result.payload.data as T
        }

        throw new Error(`Token encoding not implemented: ${this.credentialsEncoding}`)
    }
}
