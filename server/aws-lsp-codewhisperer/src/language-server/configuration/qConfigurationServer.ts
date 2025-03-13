import {
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
import { getSsoConnectionType } from '../utils'
import {
    AmazonQDeveloperProfile,
    getListAllAvailableProfilesHandler,
} from '../amazonQServiceManager/qDeveloperProfiles'
import CodeWhispererBearerTokenClient = require('../../client/token/codewhispererbearertokenclient')

// The configuration section that the server will register and listen to
export const Q_CONFIGURATION_SECTION = 'aws.q'

const Q_CUSTOMIZATIONS = 'customizations'
const Q_DEVELOPER_PROFILES = 'developerProfiles'
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

        const customizationsErrorMessage = `Failed to fetch: ${Q_CUSTOMIZATIONS}`
        const developerProfilesErrorMessage = `Failed to fetch: ${Q_DEVELOPER_PROFILES}`
        const errorCallback = (message: string) => (err: any) => {
            logging.error(`${message}: ${err}`)
            throw new ResponseError(LSPErrorCodes.RequestFailed, message)
        }

        const configurationSubSections = {
            [Q_CUSTOMIZATIONS]: () =>
                listAvailableCustomizations(codeWhispererService).catch(errorCallback(customizationsErrorMessage)),
            [Q_DEVELOPER_PROFILES]: () =>
                listAvailableProfiles(
                    (region, endpoint) => service(credentialsProvider, workspace, region, endpoint, sdkInitializator),
                    credentialsProvider,
                    logging
                ).catch(errorCallback(developerProfilesErrorMessage)),
        }

        lsp.extensions.onGetConfigurationFromServer(
            async (params: GetConfigurationFromServerParams, token: CancellationToken) => {
                const section = params.section

                let customizations: CodeWhispererBearerTokenClient.Customizations
                let developerProfiles: AmazonQDeveloperProfile[]

                try {
                    switch (section) {
                        case Q_CONFIGURATION_SECTION:
                            ;[customizations, developerProfiles] = await Promise.all([
                                configurationSubSections[Q_CUSTOMIZATIONS](),
                                Q_DEVELOPER_PROFILES_ENABLED
                                    ? configurationSubSections[Q_DEVELOPER_PROFILES]()
                                    : Promise.resolve([]),
                            ])
                            return Q_DEVELOPER_PROFILES_ENABLED
                                ? { customizations, developerProfiles }
                                : { customizations }
                        case Q_CUSTOMIZATIONS_CONFIGURATION_SECTION:
                            customizations = await configurationSubSections[Q_CUSTOMIZATIONS]()

                            return customizations
                        case Q_DEVELOPER_PROFILES_CONFIGURATION_SECTION:
                            developerProfiles = await configurationSubSections[Q_DEVELOPER_PROFILES]()

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

async function listAvailableCustomizations(
    service: CodeWhispererServiceToken
): Promise<CodeWhispererBearerTokenClient.Customizations> {
    const customizations = (await service.listAvailableCustomizations({ maxResults: 100 })).customizations

    return customizations
}

async function listAvailableProfiles(
    service: (region: string, endpoint: string) => CodeWhispererServiceToken,
    credentialsProvider: CredentialsProvider,
    logging: Logging
): Promise<AmazonQDeveloperProfile[]> {
    const handler = getListAllAvailableProfilesHandler(service)
    const connectionType = getSsoConnectionType(credentialsProvider)
    const profiles = await handler({
        connectionType,
        logging,
    })

    return profiles
}
