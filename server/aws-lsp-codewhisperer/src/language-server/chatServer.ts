import { Server } from '@aws/language-server-runtimes'
import { CredentialsProvider } from '@aws/language-server-runtimes/out/features/auth/auth'
import { Lsp } from '@aws/language-server-runtimes/out/features/lsp'
import { CodeWhispererServiceBase, CodeWhispererServiceToken } from './codeWhispererService'

// LSP event handler. Injecting the `service` to call backend APIs.
// You could also put this inline inside the `Server`.
const commandHandler: (service: CodeWhispererServiceBase) => Parameters<Lsp['onExecuteCommand']>[0] =
    service => params => {
        if (params.command !== 'ChatCommand') {
            return
        }

        service.client.makeRequest('ChatOperation', { message: params.arguments?.[0]?.message })

        return {
            result: 'ChatResult, versions: ' + service.client.apiVersions,
        }
    }

/**
 * Chat Server Factory to be able to inject a CodeWhisperer Service into the
 * Server to ease testing and injecting specific configurations.
 *
 * @param createService Inject service instance based on credentials provider.
 * @returns ChatServer
 */
export const ChatServerFactory: (
    createService: (credentialsProvider: CredentialsProvider) => CodeWhispererServiceBase
) => Server =
    createService =>
    ({ credentialsProvider, lsp }) => {
        const service = createService(credentialsProvider)

        // Do the thing
        lsp.onExecuteCommand(commandHandler(service))

        // Disposable
        return () => {
            // Do nothing
        }
    }

/**
 * Default ChatServer using Token authentication.
 */
export const ChatServer = ChatServerFactory(
    credentialsProvider => new CodeWhispererServiceToken(credentialsProvider, {})
)
