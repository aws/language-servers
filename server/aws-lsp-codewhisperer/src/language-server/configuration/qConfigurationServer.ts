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
import { getUserAgent } from '../utilities/telemetryUtils'
import {
    AmazonQDeveloperProfile,
    getListAllAvailableProfilesHandler,
    ListAllAvailableProfilesHandler,
    signalsAWSQDeveloperProfilesEnabled,
} from '../amazonQServiceManager/qDeveloperProfiles'
import { Customizations } from '../../client/token/codewhispererbearertokenclient'
import { AmazonQTokenServiceManager } from '../amazonQServiceManager/AmazonQTokenServiceManager'

// The configuration section that the server will register and listen to
export const Q_CONFIGURATION_SECTION = 'aws.q'
const Q_CUSTOMIZATIONS = 'customizations'
const Q_DEVELOPER_PROFILES = 'developerProfiles'

export const Q_CUSTOMIZATIONS_CONFIGURATION_SECTION = `${Q_CONFIGURATION_SECTION}.${Q_CUSTOMIZATIONS}`
export const Q_DEVELOPER_PROFILES_CONFIGURATION_SECTION = `${Q_CONFIGURATION_SECTION}.${Q_DEVELOPER_PROFILES}`

export const QConfigurationServerToken =
    (): Server =>
    ({ credentialsProvider, lsp, logging, runtime, workspace, sdkInitializator }) => {
        const amazonQServiceManager = AmazonQTokenServiceManager.getInstance({
            credentialsProvider,
            lsp,
            logging,
            runtime,
            workspace,
            sdkInitializator,
        })

        const serverConfigurationProvider = new ServerConfigurationProvider(
            amazonQServiceManager,
            credentialsProvider,
            logging
        )

        lsp.addInitializer((params: InitializeParams) => {
            amazonQServiceManager.updateClientConfig({
                userAgent: getUserAgent(params, runtime.serverInfo),
            })

            // TODO: set profiles enabled in service manager
            if (params.initializationOptions?.aws) {
                const isDeveloperProfilesEnabled = signalsAWSQDeveloperProfilesEnabled(params.initializationOptions.aws)
                serverConfigurationProvider.qDeveloperProfilesEnabled = isDeveloperProfilesEnabled
            }

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

        lsp.extensions.onGetConfigurationFromServer(
            async (params: GetConfigurationFromServerParams, token: CancellationToken) => {
                const section = params.section

                let customizations: Customizations
                let developerProfiles: AmazonQDeveloperProfile[]

                try {
                    switch (section) {
                        case Q_CONFIGURATION_SECTION:
                            ;[customizations, developerProfiles] = await Promise.all([
                                serverConfigurationProvider.listAvailableCustomizations(),
                                serverConfigurationProvider.listAvailableProfiles(),
                            ])

                            return serverConfigurationProvider.qDeveloperProfilesEnabled
                                ? { customizations, developerProfiles }
                                : { customizations }
                        case Q_CUSTOMIZATIONS_CONFIGURATION_SECTION:
                            customizations = await serverConfigurationProvider.listAvailableCustomizations()

                            return customizations
                        case Q_DEVELOPER_PROFILES_CONFIGURATION_SECTION:
                            developerProfiles = await serverConfigurationProvider.listAvailableProfiles()

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

const ON_GET_CONFIGURATION_FROM_SERVER_ERROR_PREFIX = 'Failed to fetch: '

export class ServerConfigurationProvider {
    private _qDeveloperProfilesEnabled = false
    private listAllAvailableProfilesHandler: ListAllAvailableProfilesHandler

    constructor(
        private serviceManager: AmazonQTokenServiceManager,
        private credentialsProvider: CredentialsProvider,
        private logging: Logging
    ) {
        this.listAllAvailableProfilesHandler = getListAllAvailableProfilesHandler(serviceManager.getServiceFactory())
    }

    get qDeveloperProfilesEnabled(): boolean {
        return this._qDeveloperProfilesEnabled
    }

    set qDeveloperProfilesEnabled(value: boolean) {
        this.logging.debug(`Setting qDeveloperProfilesEnabled to: ${value}`)
        this._qDeveloperProfilesEnabled = value
    }

    async listAvailableProfiles(): Promise<AmazonQDeveloperProfile[]> {
        if (!this.qDeveloperProfilesEnabled) {
            this.logging.debug('Q developer profiles disabled - returning empty list')
            return []
        }

        try {
            const profiles = await this.listAllAvailableProfilesHandler({
                connectionType: this.credentialsProvider.getConnectionType(),
                logging: this.logging,
            })

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
