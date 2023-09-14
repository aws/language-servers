import { Auth, Logging, Lsp, Telemetry, Workspace } from '@aws-placeholder/aws-language-server-runtimes/out/features'
import { CredentialsType } from '@aws-placeholder/aws-language-server-runtimes/out/features/auth'
import { InlineCompletionParams } from '@aws-placeholder/aws-language-server-runtimes/out/features/lsp/inline-completions/futureProtocol'
import { InlineCompletionList } from '@aws-placeholder/aws-language-server-runtimes/out/features/lsp/inline-completions/futureTypes'
import { Server } from '@aws-placeholder/aws-language-server-runtimes/out/runtimes'
import { CancellationToken } from 'vscode-languageserver'
import { CodeWhispererServiceIAM, CodeWhispererServiceToken } from './codeWhispererService'

const CodewhispererServerFactory = (credentialsType: CredentialsType): Server => {
    return (features: { auth: Auth; lsp: Lsp; workspace: Workspace; logging: Logging; telemetry: Telemetry }) => {
        const { auth, lsp, workspace, logging, telemetry } = features

        const codeWhispererService =
            credentialsType === 'iam' ? new CodeWhispererServiceIAM(auth) : new CodeWhispererServiceToken(auth)

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
                        context: { triggerKind: 0 },
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

        return () => {}
    }
}

export const CodeWhispererServerIAM = CodewhispererServerFactory('iam')
export const CodeWhispererServerToken = CodewhispererServerFactory('bearer')
