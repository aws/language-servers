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

// The configuration section that the server will register and listen to
export const Q_CONFIGURATION_SECTION = 'aws.q'
export const QConfigurationServerToken =
    (service: (credentials: CredentialsProvider, workspace: Workspace) => CodeWhispererServiceToken): Server =>
    ({ credentialsProvider, lsp, logging, runtime, workspace }) => {
        const codeWhispererService = service(credentialsProvider, workspace)

        lsp.addInitializer((params: InitializeParams) => {
            codeWhispererService.updateClientConfig({
                customUserAgent: getUserAgent(params, runtime.serverInfo),
            })

            return {
                capabilities: {},
                awsServerCapabilities: {
                    configurationProvider: { sections: [Q_CONFIGURATION_SECTION] },
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
            }
        )

        logging.log('Amazon Q Customization server has been initialised')
        return () => {}
    }
