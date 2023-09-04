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
    const { auth, lsp, workspace, logging, telemetry } = features
    const codeWhispererService = new CodeWhispererService()

    const onCompletionHandler = async (
        params: CompletionParams,
        _token: CancellationToken
    ): Promise<CompletionList> => {
        const completions: CompletionList = {
            items: [],
            isIncomplete: false,
        }

        const textDocument = await workspace.getTextDocument(params.textDocument.uri)
        // todo determine file type and check if supported
        if (textDocument) {
            try {
                const recommendations = await codeWhispererService.doComplete(textDocument, params.position)
                if (recommendations) {
                    return recommendations
                    const recommendations = await codeWhispererService.doComplete(textDocument, params.position)
                    if (recommendations) {
                        return recommendations
                    }
                } catch (err) {
                    logging.log(`Recommendation failure: ${err}`)
                }
            }
        }

        return completions
        return completions
    }

    lsp.onCompletion(onCompletionHandler)
    logging.log('Codewhisperer server has been initialised')

    return () => { }
}
