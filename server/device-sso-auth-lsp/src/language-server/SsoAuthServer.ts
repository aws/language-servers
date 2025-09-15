import {
    CredentialsProvider,
    Logging,
    Lsp,
    MessageType,
    Server,
    Telemetry,
    Workspace,
} from '@aws/language-server-runtimes/server-interface'
import { CancellationToken, ExecuteCommandParams, InitializeParams } from 'vscode-languageserver/node'
import { BuilderIdConnectionBuilder, SsoConnection, DEFAULT_TOKEN_CACHE_DIR } from './sso/builderId'

const AUTH_DEVICE_COMMAND = 'ssoAuth/authDevice/getToken'

export const SsoAuthServer: Server = (features: {
    credentialsProvider: CredentialsProvider
    lsp: Lsp
    workspace: Workspace
    logging: Logging
    telemetry: Telemetry
}) => {
    const { lsp, logging } = features
    let activeBuilderIdConnection: SsoConnection | undefined
    let tokenCacheLocation = DEFAULT_TOKEN_CACHE_DIR

    const onInitializedHandler = async () => {}

    const resolveBearerToken = async (startUrl: string) => {
        activeBuilderIdConnection = await BuilderIdConnectionBuilder.build(
            {
                openSsoPortalLink: async (
                    startUrl: string,
                    authorization: { readonly verificationUri: string; readonly userCode: string }
                ) => {
                    logging.log(`SSO Auth flow for ${startUrl}`)
                    logging.log(
                        `To proceed, open the login page ${authorization.verificationUri} and provide this code to confirm the access request: ${authorization.userCode}`
                    )

                    lsp.window.showMessage({
                        type: MessageType.Info,
                        message: `To proceed, open the login page ${authorization.verificationUri} and provide this code to confirm the access request: ${authorization.userCode}`,
                    })

                    return true
                },
            },
            startUrl,
            tokenCacheLocation
        )

        const token = await activeBuilderIdConnection.getToken()

        logging.log('Resolved SSO token ' + JSON.stringify(token))

        return {
            token: token.accessToken,
        }
    }

    const onExecuteCommandHandler = async (params: ExecuteCommandParams, _token: CancellationToken): Promise<any> => {
        switch (params.command) {
            case AUTH_DEVICE_COMMAND:
                logging.log('Auth Device command called')

                // @ts-ignore
                return await resolveBearerToken(params.arguments?.startUrl)
        }
        return
    }

    lsp.addInitializer((params: InitializeParams) => {
        logging.log('SSO Auth capability has been initialised')

        tokenCacheLocation = params.initializationOptions?.tokenCacheLocation || DEFAULT_TOKEN_CACHE_DIR

        return {
            capabilities: {
                executeCommandProvider: {
                    commands: [AUTH_DEVICE_COMMAND],
                },
            },
        }
    })
    lsp.onInitialized(onInitializedHandler)
    lsp.onExecuteCommand(onExecuteCommandHandler)

    logging.log('SSO Auth capability server has been initialised')

    // disposable
    return () => {
        // Do nothing
    }
}
