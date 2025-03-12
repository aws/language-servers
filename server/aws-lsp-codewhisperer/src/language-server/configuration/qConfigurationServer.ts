import {
    CancellationToken,
    CredentialsProvider,
    GetConfigurationFromServerParams,
    InitializeParams,
    Server,
    Workspace,
} from '@aws/language-server-runtimes/server-interface'
import { CodeWhispererServiceToken } from '../codeWhispererService'
import { getUserAgent } from '../utilities/telemetryUtils'
import { DEFAULT_AWS_Q_ENDPOINT_URL, DEFAULT_AWS_Q_REGION } from '../../constants'
import { SDKInitializator } from '@aws/language-server-runtimes/server-interface'
import { getSsoConnectionType } from '../utils'
import { getListAllAvailableProfilesHandler } from '../amazonQServiceManager/qDeveloperProfiles'

// The configuration section that the server will register and listen to
export const Q_CONFIGURATION_SECTION = 'aws.q'
export const Q_DEVELOPER_PROFILES_CONFIGURATION_SECTION = `${Q_CONFIGURATION_SECTION}.developerProfiles`
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
                        sections: [Q_CONFIGURATION_SECTION, Q_DEVELOPER_PROFILES_CONFIGURATION_SECTION],
                    },
                },
            }
        })

        lsp.extensions.onGetConfigurationFromServer(
            async (params: GetConfigurationFromServerParams, token: CancellationToken) => {
                if (params.section === Q_CONFIGURATION_SECTION) {
                    const customizations = (await codeWhispererService.listAvailableCustomizations({ maxResults: 100 }))
                        .customizations

                    return { customizations }
                }

                if (params.section === Q_DEVELOPER_PROFILES_CONFIGURATION_SECTION) {
                    const handler = getListAllAvailableProfilesHandler((region, endpoint) =>
                        service(credentialsProvider, workspace, region, endpoint, sdkInitializator)
                    )
                    const connectionType = getSsoConnectionType(credentialsProvider)
                    const profiles = await handler({
                        connectionType,
                        logging,
                    })

                    return { profiles }
                }
            }
        )

        logging.log('Amazon Q Customization server has been initialised')
        return () => {}
    }
