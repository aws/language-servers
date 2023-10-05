import { CredentialsProvider, Logging, Lsp, Telemetry, Workspace } from '@aws-placeholder/aws-language-server-runtimes/out/features'
import { Server } from '@aws-placeholder/aws-language-server-runtimes/out/runtimes'
import {
    CancellationToken,
    CompletionItem,
    CompletionItemKind,
    CompletionList,
    CompletionParams,
} from 'vscode-languageserver/node'

const onCompletionHandler = async (_params: CompletionParams, _token: CancellationToken): Promise<CompletionList> => {
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

export const HelloWorldServer: Server = (features: {
    credentialsProvider: CredentialsProvider
    lsp: Lsp
    workspace: Workspace
    logging: Logging
    telemetry: Telemetry
}) => {
    const { lsp, logging } = features

    lsp.onCompletion(onCompletionHandler)
    logging.log('The Hello World Capability has been initialised')

    // disposable
    return () => {
        // Do nothing
    }
}