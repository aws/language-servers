import { CredentialsProvider } from '@aws-placeholder/aws-language-server-runtimes/out/features'
import { InlineCompletionParams } from '@aws-placeholder/aws-language-server-runtimes/out/features/lsp/inline-completions/futureProtocol'
import { InlineCompletionContext, InlineCompletionItem, InlineCompletionList, InlineCompletionTriggerKind } from '@aws-placeholder/aws-language-server-runtimes/out/features/lsp/inline-completions/futureTypes'
import { Server } from '@aws-placeholder/aws-language-server-runtimes/out/runtimes'
import { CancellationToken } from 'vscode-languageserver'
import { Position, TextDocument } from 'vscode-languageserver-textdocument'
import { CodeWhispererServiceBase, CodeWhispererServiceIAM, CodeWhispererServiceToken, GenerateSuggestionsRequest, Suggestion } from './codeWhispererService'
import { getSupportedLanguageId } from './languageDetection'
import { truncateOverlapWithRightContext } from './mergeRightUtils'

interface DoInlineCompletionParams {
    textDocument: TextDocument
    position: Position
    context: InlineCompletionContext
    token?: CancellationToken
    inferredLanguageId: string
}

interface GetSuggestionsParams {
    textDocument: TextDocument
    position: Position
    maxResults: number
    token: CancellationToken
    inferredLanguageId: string
}


export const CodewhispererServerFactory = (service: (credentials: CredentialsProvider) => CodeWhispererServiceBase): Server =>
    ({ credentialsProvider, lsp, workspace, logging }) => {
        const codeWhispererService = service(credentialsProvider)

        // const setCustomisation= async (a: any) : any => {
        //     // call the underlying codewhisperer service, or set a flag to 
        // }

        const getSuggestions = async (params: GetSuggestionsParams): Promise<Suggestion[]> => {
            const left = params.textDocument.getText({
                start: { line: 0, character: 0 },
                end: params.position,
            })
            const right = params.textDocument.getText({
                start: params.position,
                end: params.textDocument.positionAt(params.textDocument.getText().length),
            })

            const request: GenerateSuggestionsRequest = {
                fileContext: {
                    filename: params.textDocument.uri,
                    programmingLanguage: {
                        languageName: params.inferredLanguageId,
                    },
                    leftFileContent: left,
                    rightFileContent: right,
                },
                maxResults: params.maxResults,
            }

            return codeWhispererService.generateSuggestions(request)
        }

        const doInlineCompletion = async (params: DoInlineCompletionParams): Promise<InlineCompletionList | null> => {
            const recommendations = await getSuggestions({
                textDocument: params.textDocument,
                position: params.position,
                maxResults: params.context.triggerKind == InlineCompletionTriggerKind.Automatic ? 1 : 5,
                token: params.token || CancellationToken.None,
                inferredLanguageId: params.inferredLanguageId
            })

            const items: InlineCompletionItem[] = recommendations.map<InlineCompletionItem>(r => {
                return {
                    insertText: truncateOverlapWithRightContext(params.textDocument, r.content, params.position),
                    range: params.context.selectedCompletionInfo?.range,
                }
            })

            const completions: InlineCompletionList = {
                items,
            }

            return completions
        }

        const onInlineCompletionHandler = async (
            params: InlineCompletionParams,
            _token: CancellationToken
        ): Promise<InlineCompletionList> => {
            const completions: InlineCompletionList = {
                items: [],
            }

            const textDocument = await workspace.getTextDocument(params.textDocument.uri)
            const languageId = getSupportedLanguageId(textDocument)
            if (textDocument && languageId) {
                try {
                    const recommendations = await doInlineCompletion({
                        textDocument,
                        position: params.position,
                        context: { triggerKind: params.context.triggerKind },
                        inferredLanguageId: languageId
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
