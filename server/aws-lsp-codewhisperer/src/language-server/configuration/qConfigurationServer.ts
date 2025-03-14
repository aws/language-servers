import {
    CancellationToken,
    CredentialsProvider,
    GetConfigurationFromServerParams,
    InitializeParams,
    LSPErrorCodes,
    ResponseError,
    Server,
    Workspace,
} from '@aws/language-server-runtimes/server-interface'
import { CodeWhispererServiceToken } from '../codeWhispererService'
import { getUserAgent } from '../utilities/telemetryUtils'
import { DEFAULT_AWS_Q_ENDPOINT_URL, DEFAULT_AWS_Q_REGION } from '../../constants'
import { SDKInitializator } from '@aws/language-server-runtimes/server-interface'
import { AmazonQDeveloperProfile } from '../amazonQServiceManager/qDeveloperProfiles'
import { Customizations } from '../../client/token/codewhispererbearertokenclient'
import { Q_CUSTOMIZATIONS, Q_DEVELOPER_PROFILES } from './constants'
import { OnGetConfigurationFromServerManager } from './onConfigurationFromServerManager'

// The configuration section that the server will register and listen to
export const Q_CONFIGURATION_SECTION = 'aws.q'

export const Q_CUSTOMIZATIONS_CONFIGURATION_SECTION = `${Q_CONFIGURATION_SECTION}.${Q_CUSTOMIZATIONS}`
export const Q_DEVELOPER_PROFILES_CONFIGURATION_SECTION = `${Q_CONFIGURATION_SECTION}.${Q_DEVELOPER_PROFILES}`

// WIP: Temporary flag until client can signal they support developer profiles
const Q_DEVELOPER_PROFILES_ENABLED = false

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

        lsp.addInitializer((params: InitializeParams) => {
            codeWhispererService.updateClientConfig({
                customUserAgent: getUserAgent(params, runtime.serverInfo),
            })

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

        const onGetConfigurationFromServerManager = new OnGetConfigurationFromServerManager(
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

        lsp.extensions.onGetConfigurationFromServer(
            async (params: GetConfigurationFromServerParams, token: CancellationToken) => {
                const section = params.section

                let customizations: Customizations
                let developerProfiles: AmazonQDeveloperProfile[]

                try {
                    switch (section) {
                        case Q_CONFIGURATION_SECTION:
                            ;[customizations, developerProfiles] = await Promise.all([
                                onGetConfigurationFromServerManager.listAvailableCustomizations(),
                                Q_DEVELOPER_PROFILES_ENABLED
                                    ? onGetConfigurationFromServerManager.listAvailableProfiles()
                                    : Promise.resolve([]),
                            ])
                            return Q_DEVELOPER_PROFILES_ENABLED
                                ? { customizations, developerProfiles }
                                : { customizations }
                        case Q_CUSTOMIZATIONS_CONFIGURATION_SECTION:
                            customizations = await onGetConfigurationFromServerManager.listAvailableCustomizations()

                            return customizations
                        case Q_DEVELOPER_PROFILES_CONFIGURATION_SECTION:
                            developerProfiles = await onGetConfigurationFromServerManager.listAvailableProfiles()

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
