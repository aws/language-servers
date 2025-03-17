import {
    AWSInitializationOptions,
    CancellationToken,
    CredentialsProvider,
    GetConfigurationFromServerParams,
    InitializeParams,
    Logging,
    LSPErrorCodes,
    ResponseError,
    Server,
    Workspace,
} from '@aws/language-server-runtimes/server-interface'
import { CodeWhispererServiceToken } from '../codeWhispererService'
import { getUserAgent } from '../utilities/telemetryUtils'
import { DEFAULT_AWS_Q_ENDPOINT_URL, DEFAULT_AWS_Q_REGION } from '../../constants'
import { SDKInitializator } from '@aws/language-server-runtimes/server-interface'
import {
    AmazonQDeveloperProfile,
    getListAllAvailableProfilesHandler,
    ListAllAvailableProfilesHandler,
} from '../amazonQServiceManager/qDeveloperProfiles'
import { Customizations } from '../../client/token/codewhispererbearertokenclient'
import { isBool, isObject } from '../utils'

// The configuration section that the server will register and listen to
export const Q_CONFIGURATION_SECTION = 'aws.q'
const Q_CUSTOMIZATIONS = 'customizations'
const Q_DEVELOPER_PROFILES = 'developerProfiles'

export const Q_CUSTOMIZATIONS_CONFIGURATION_SECTION = `${Q_CONFIGURATION_SECTION}.${Q_CUSTOMIZATIONS}`
export const Q_DEVELOPER_PROFILES_CONFIGURATION_SECTION = `${Q_CONFIGURATION_SECTION}.${Q_DEVELOPER_PROFILES}`

export const QConfigurationServerToken =
    (
        service: (
            credentials: CredentialsProvider,
            workspace: Workspace,
            awsQRegion: string,
            awsQEndpointUrl: string,
            sdkInitializator: SDKInitializator
        ) => CodeWhispererServiceToken
    ): Server =>
    ({ credentialsProvider, lsp, logging, runtime, workspace, sdkInitializator }) => {
        const codeWhispererService = service(
            credentialsProvider,
            workspace,
            runtime.getConfiguration('AWS_Q_REGION') ?? DEFAULT_AWS_Q_REGION,
            runtime.getConfiguration('AWS_Q_ENDPOINT_URL') ?? DEFAULT_AWS_Q_ENDPOINT_URL,
            sdkInitializator
        )

        const serverConfigurationProvider = new ServerConfigurationProvider(
            codeWhispererService,
            credentialsProvider,
            logging,
            (region, endpoint) => {
                const client = service(credentialsProvider, workspace, region, endpoint, sdkInitializator)
                if (codeWhispererService.client.config.customUserAgent)
                    client.updateClientConfig({
                        customUserAgent: codeWhispererService.client.config.customUserAgent,
                    })
                return client
            }
        )

        lsp.addInitializer((params: InitializeParams) => {
            codeWhispererService.updateClientConfig({
                customUserAgent: getUserAgent(params, runtime.serverInfo),
            })

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

        logging.log('Amazon Q Customization server has been initialised')
        return () => {}
    }

const ON_GET_CONFIGURATION_FROM_SERVER_ERROR_PREFIX = 'Failed to fetch: '

export class ServerConfigurationProvider {
    // WIP: add functionality to set profiles enabled based on client capabilities
    private _qDeveloperProfilesEnabled = false
    private listAllAvailableProfilesHandler: ListAllAvailableProfilesHandler

    constructor(
        private service: CodeWhispererServiceToken,
        private credentialsProvider: CredentialsProvider,
        private logging: Logging,
        serviceFromEndpointAndRegion: (region: string, endpoint: string) => CodeWhispererServiceToken
    ) {
        this.listAllAvailableProfilesHandler = getListAllAvailableProfilesHandler(serviceFromEndpointAndRegion)
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
            const customizations = (await this.service.listAvailableCustomizations({ maxResults: 100 })).customizations

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

const AWSQCapabilitiesKey = 'q'
const developerProfilesEnabledKey = 'developerProfiles'

export function signalsAWSQDeveloperProfilesEnabled(initializationOptions: AWSInitializationOptions): boolean {
    const qCapibilities = initializationOptions.awsClientCapabilities?.[AWSQCapabilitiesKey]

    if (
        isObject(qCapibilities) &&
        !(qCapibilities instanceof Array) &&
        developerProfilesEnabledKey in qCapibilities &&
        isBool(qCapibilities[developerProfilesEnabledKey])
    ) {
        return qCapibilities[developerProfilesEnabledKey]
    }

    return false
}
