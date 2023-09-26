import { Auth } from '@aws-placeholder/aws-language-server-runtimes/out/features'
import { InlineCompletionParams } from '@aws-placeholder/aws-language-server-runtimes/out/features/lsp/inline-completions/futureProtocol'
import { InlineCompletionList } from '@aws-placeholder/aws-language-server-runtimes/out/features/lsp/inline-completions/futureTypes'
import { Server } from '@aws-placeholder/aws-language-server-runtimes/out/runtimes'
import { CancellationToken } from 'vscode-languageserver'
import { CodeWhispererServiceBase, CodeWhispererServiceIAM, CodeWhispererServiceToken } from './codeWhispererService'

export const CodewhispererServerFactory = (service: (auth: Auth) => CodeWhispererServiceBase): Server =>
    ({ auth, lsp, workspace, logging }) => {
        const codeWhispererService = service(auth)

        const onInlineCompletionHandler = async (
            params: InlineCompletionParams,
            _token: CancellationToken
        ): Promise<InlineCompletionList> => {
            const completions: InlineCompletionList = {
                items: [],
            }

            const textDocument = await workspace.getTextDocument(params.textDocument.uri)
            // todo determine file type and check if supported
            if (textDocument) {
                try {
                    const recommendations = await codeWhispererService.doInlineCompletion({
                        textDocument,
                        position: params.position,
                        context: { triggerKind: params.context.triggerKind },
                    })
                    if (recommendations) {
                        return recommendations
                    }
                } catch (err) {
                    logging.log(`Recommendation failure: ${err}`)
                }
            }
            return completions
        }

        lsp.onInlineCompletion(onInlineCompletionHandler)
        logging.log('Codewhisperer server has been initialised')

        return () => { /* do nothing */ }
    }

export const CodeWhispererServerIAM = CodewhispererServerFactory(auth => new CodeWhispererServiceIAM(auth))
export const CodeWhispererServerToken = CodewhispererServerFactory(auth => new CodeWhispererServiceToken(auth))
