import {
    CancellationToken,
    CredentialsProvider,
    GetConfigurationFromServerParams,
    InitializeParams,
    Logging,
    LSPErrorCodes,
    ResponseError,
    Server,
} from '@aws/language-server-runtimes/server-interface'
import {
    AmazonQDeveloperProfile,
    getListAllAvailableProfilesHandler,
    ListAllAvailableProfilesHandler,
} from '../../shared/amazonQServiceManager/qDeveloperProfiles'
import { Customizations } from '../../client/token/codewhispererbearertokenclient'
import { AmazonQTokenServiceManager } from '../../shared/amazonQServiceManager/AmazonQTokenServiceManager'
import { Q_CONFIGURATION_SECTION } from '../../shared/constants'

const Q_CUSTOMIZATIONS = 'customizations'
const Q_DEVELOPER_PROFILES = 'developerProfiles'

export const Q_CUSTOMIZATIONS_CONFIGURATION_SECTION = `${Q_CONFIGURATION_SECTION}.${Q_CUSTOMIZATIONS}`
export const Q_DEVELOPER_PROFILES_CONFIGURATION_SECTION = `${Q_CONFIGURATION_SECTION}.${Q_DEVELOPER_PROFILES}`

export const QConfigurationServerToken =
    (): Server =>
    ({ credentialsProvider, lsp, logging, runtime, workspace, sdkInitializator }) => {
        let amazonQServiceManager: AmazonQTokenServiceManager
        let serverConfigurationProvider: ServerConfigurationProvider

        lsp.addInitializer((params: InitializeParams) => {
            return {
                capabilities: {},
                awsServerCapabilities: {
                    configurationProvider: {
                        sections: [
                            Q_CONFIGURATION_SECTION,
                            Q_CUSTOMIZATIONS_CONFIGURATION_SECTION,
                            Q_DEVELOPER_PROFILES_CONFIGURATION_SECTION,
                        ],
                    },
                },
            }
        })

        lsp.onInitialized(async () => {
            amazonQServiceManager = AmazonQTokenServiceManager.getInstance({
                credentialsProvider,
                lsp,
                logging,
                runtime,
                workspace,
                sdkInitializator,
            })

            serverConfigurationProvider = new ServerConfigurationProvider(
                amazonQServiceManager,
                credentialsProvider,
                logging
            )

            logging.log(
                `Pranav 2 ${JSON.stringify(credentialsProvider.getConnectionMetadata())}: ${JSON.stringify(credentialsProvider.getConnectionType())} : ${JSON.stringify(credentialsProvider.getCredentials)}`
            )
            /* 
                            Calling handleDidChangeConfiguration once to ensure we get configuration atleast once at start up
                            
                            TODO: TODO: consider refactoring such responsibilities to common service manager config/initialisation server
                        */
            await amazonQServiceManager.handleDidChangeConfiguration()
        })

        lsp.extensions.onGetConfigurationFromServer(
            async (params: GetConfigurationFromServerParams, token: CancellationToken) => {
                const section = params.section
                logging.log(`Pranav 1 ${JSON.stringify(params)}: ${JSON.stringify(token)} : ${section}`)

                let customizations: Customizations
                let developerProfiles: AmazonQDeveloperProfile[]
                logging.log(`Pranav 3 ${JSON.stringify(serverConfigurationProvider.listAvailableProfiles(token))}`)

                try {
                    switch (section) {
                        case Q_CONFIGURATION_SECTION:
                            ;[customizations, developerProfiles] = await Promise.all([
                                serverConfigurationProvider.listAvailableCustomizations(),
                                serverConfigurationProvider.listAvailableProfiles(token),
                            ])

                            throwIfCancelled(token)

                            return amazonQServiceManager.getEnableDeveloperProfileSupport()
                                ? { customizations, developerProfiles }
                                : { customizations }
                        case Q_CUSTOMIZATIONS_CONFIGURATION_SECTION:
                            customizations = await serverConfigurationProvider.listAvailableCustomizations()

                            return customizations
                        case Q_DEVELOPER_PROFILES_CONFIGURATION_SECTION:
                            developerProfiles = await serverConfigurationProvider.listAvailableProfiles(token)

                            throwIfCancelled(token)

                            return developerProfiles
                        default:
                            break
                    }
                } catch (error) {
                    if (error instanceof ResponseError) {
                        throw error
                    }

                    logging.error(`Failed to fetch resources for section ${section}: ${error}`)
                    throw new ResponseError(
                        LSPErrorCodes.RequestFailed,
                        `An unexpected error occured while fetching resource(s) for section: ${section}`
                    )
                }
            }
        )

        logging.log('Amazon Q Configuration server has been initialised')
        return () => {}
    }

function throwIfCancelled(token: CancellationToken) {
    if (token.isCancellationRequested) {
        throw new ResponseError(LSPErrorCodes.RequestCancelled, 'Request cancelled')
    }
}

const ON_GET_CONFIGURATION_FROM_SERVER_ERROR_PREFIX = 'Failed to fetch: '

export class ServerConfigurationProvider {
    private listAllAvailableProfilesHandler: ListAllAvailableProfilesHandler

    constructor(
        private serviceManager: AmazonQTokenServiceManager,
        private credentialsProvider: CredentialsProvider,
        private logging: Logging
    ) {
        this.listAllAvailableProfilesHandler = getListAllAvailableProfilesHandler(
            this.serviceManager.getServiceFactory()
        )
    }

    async listAvailableProfiles(token: CancellationToken): Promise<AmazonQDeveloperProfile[]> {
        this.logging.debug('pranav 6 listAvailableProfiles' + this.serviceManager.getEnableDeveloperProfileSupport())
        // if (!this.serviceManager.getEnableDeveloperProfileSupport()) {
        //     this.logging.debug('Q developer profiles disabled - returning empty list')
        //     return []
        // }

        try {
            const profiles = await this.listAllAvailableProfilesHandler({
                connectionType: this.credentialsProvider.getConnectionType(),
                logging: this.logging,
                token: token,
            })

            this.logging.debug('pranav 6 listAvailableProfiles' + JSON.stringify(profiles))
            return profiles
        } catch (error) {
            throw this.getResponseError(
                `${ON_GET_CONFIGURATION_FROM_SERVER_ERROR_PREFIX}${Q_DEVELOPER_PROFILES}`,
                error
            )
        }
    }

    async listAvailableCustomizations(): Promise<Customizations> {
        try {
            const customizations = (
                await this.serviceManager.getCodewhispererService().listAvailableCustomizations({ maxResults: 100 })
            ).customizations

            return customizations
        } catch (error) {
            throw this.getResponseError(`${ON_GET_CONFIGURATION_FROM_SERVER_ERROR_PREFIX}${Q_CUSTOMIZATIONS}`, error)
        }
    }

    private getResponseError(message: string, error: any): ResponseError {
        this.logging.error(`${message}: ${error}`)
        return new ResponseError(LSPErrorCodes.RequestFailed, message)
    }
}
