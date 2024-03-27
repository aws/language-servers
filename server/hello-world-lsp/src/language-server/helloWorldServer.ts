import {
    Server,
    Logging,
    Lsp,
    Telemetry,
    Workspace,
    CredentialsProvider,
} from '@aws/language-server-runtimes/server-interface'
import {
    CancellationToken,
    CompletionItem,
    CompletionItemKind,
    CompletionList,
    CompletionParams,
    ExecuteCommandParams,
} from 'vscode-languageserver/node'
import { HelloWorldService } from './helloWorldService'

export const HelloWorldServerFactory =
    (service: HelloWorldService): Server =>
    (features: {
        credentialsProvider: CredentialsProvider
        lsp: Lsp
        workspace: Workspace
        logging: Logging
        telemetry: Telemetry
    }) => {
        const onInitializedHandler = async () => {}

        const onCompletionHandler = async (
            _params: CompletionParams,
            _token: CancellationToken
        ): Promise<CompletionList> => {
            // For the example, we will always return these completion items
            const items: CompletionItem[] = [
                {
                    label: 'Hello World!!!',
                    kind: CompletionItemKind.Text,
                },
                {
                    label: 'Hello Developers!!!',
                    kind: CompletionItemKind.Text,
                },
            ]

            const completions: CompletionList = {
                isIncomplete: false,
                items,
            }

            return completions
        }

        const onExecuteCommandHandler = async (
            params: ExecuteCommandParams,
            _token: CancellationToken
        ): Promise<any> => {
            switch (params.command) {
                case '/helloWorld/log':
                    service.logCommand()
                    break
            }
            return
        }
        const { lsp, logging } = features

        lsp.onInitialized(onInitializedHandler)
        lsp.onCompletion(onCompletionHandler)
        lsp.onExecuteCommand(onExecuteCommandHandler)

        logging.log('The Hello World Capability has been initialised')

        // disposable
        return () => {
            // Do nothing
        }
    }

const service = new HelloWorldService()
export const HelloWorldServer = HelloWorldServerFactory(service)
