import { Auth, Logging, Lsp, Telemetry, Workspace } from '@aws-placeholder/aws-language-server-runtimes/out/features'
import { Server } from '@aws-placeholder/aws-language-server-runtimes/out/runtimes'
import { CancellationToken, CompletionList, CompletionParams } from 'vscode-languageserver'
import { CodeWhispererService } from './codeWhispererService'

export const CodeWhispererServer: Server = (features: {
    auth: Auth
    lsp: Lsp
    workspace: Workspace
    logging: Logging
    telemetry: Telemetry
}) => {
    features.logging.log = console.log

    const codeWhispererService = new CodeWhispererService({ displayName: 'aws-lsp-codewhisperer' })

    const onCompletionHandler = async (
        params: CompletionParams,
        _token: CancellationToken
    ): Promise<CompletionList> => {
        const completions: CompletionList = {
            items: [],
            isIncomplete: false,
        }

        const textDocument = await features.workspace.getTextDocument(params.textDocument.uri)
        // todo determine file type and check if supported
        if (textDocument) {
            try {
                const recommendations = await codeWhispererService.doComplete(textDocument, params.position)
                if (recommendations) {
                    return recommendations
                }
            } catch (err) {
                console.log(err)
            }
        }

        return completions
    }

    features.lsp.onCompletion(onCompletionHandler)
    features.logging.log('Codewhisperer server has been initialised')

    return () => {}
}
