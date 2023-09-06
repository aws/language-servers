import { Auth, Logging, Lsp, Telemetry, Workspace } from '@aws-placeholder/aws-language-server-runtimes/out/features'
import { Server } from '@aws-placeholder/aws-language-server-runtimes/out/runtimes'
import { CancellationToken, CompletionList, CompletionParams } from 'vscode-languageserver'
import { CodeWhispererServiceBase, CodeWhispererServiceIAM, CodeWhispererServiceToken } from './codeWhispererService'

const completionHandler = async (
    params: CompletionParams,
    _token: CancellationToken,
    workspace: Workspace,
    logging: Logging,
    codeWhispererService: CodeWhispererServiceBase
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
            }
        } catch (err) {
            logging.log(`Recommendation failure: ${err}`)
        }
    }
    return completions
}

export const CodeWhispererServerToken: Server = (features: {
    auth: Auth
    lsp: Lsp
    workspace: Workspace
    logging: Logging
    telemetry: Telemetry
}) => {
    const { auth, lsp, workspace, logging, telemetry } = features
    const codeWhispererService = new CodeWhispererServiceToken()

    const onCompletionHandler = async (
        params: CompletionParams,
        _token: CancellationToken
    ): Promise<CompletionList> => {
        return await completionHandler(params, _token, workspace, logging, codeWhispererService)
    }
    lsp.onCompletion(onCompletionHandler)
    logging.log('Codewhisperer server has been initialised')

    return () => {}
}

export const CodeWhispererServerIAM: Server = (features: {
    auth: Auth
    lsp: Lsp
    workspace: Workspace
    logging: Logging
    telemetry: Telemetry
}) => {
    const { auth, lsp, workspace, logging, telemetry } = features
    const codeWhispererService = new CodeWhispererServiceIAM()

    const onCompletionHandler = async (
        params: CompletionParams,
        _token: CancellationToken
    ): Promise<CompletionList> => {
        return await completionHandler(params, _token, workspace, logging, codeWhispererService)
    }
    lsp.onCompletion(onCompletionHandler)
    logging.log('Codewhisperer server has been initialised')

    return () => {}
}
