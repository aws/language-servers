import { Server } from '@aws-placeholder/aws-language-server-runtimes'
import { CredentialsProvider } from '@aws-placeholder/aws-language-server-runtimes/out/features'
import {
    InlineCompletionItemWithReferences,
    InlineCompletionListWithReferences,
    InlineCompletionWithReferencesParams,
} from '@aws-placeholder/aws-language-server-runtimes/out/features/lsp/inline-completions/protocolExtensions'
import { CancellationToken, InlineCompletionContext, InlineCompletionTriggerKind } from 'vscode-languageserver'
import { Position, TextDocument } from 'vscode-languageserver-textdocument'
import {
    CodeWhispererServiceBase,
    CodeWhispererServiceIAM,
    CodeWhispererServiceToken,
    GenerateSuggestionsRequest,
    Suggestion,
} from './codeWhispererService'
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

export const CodewhispererServerFactory =
    (service: (credentials: CredentialsProvider) => CodeWhispererServiceBase): Server =>
    ({ credentialsProvider, lsp, workspace, logging }) => {
        const codeWhispererService = service(credentialsProvider)

        let includeSuggestionsWithCodeReferences = true

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

        const doInlineCompletion = async (
            params: DoInlineCompletionParams
        ): Promise<InlineCompletionListWithReferences | null> => {
            const recommendations = await getSuggestions({
                textDocument: params.textDocument,
                position: params.position,
                maxResults: params.context.triggerKind == InlineCompletionTriggerKind.Automatic ? 1 : 5,
                token: params.token || CancellationToken.None,
                inferredLanguageId: params.inferredLanguageId,
            })

            const items: InlineCompletionItemWithReferences[] = recommendations.map<InlineCompletionItemWithReferences>(
                r => {
                    return {
                        insertText: truncateOverlapWithRightContext(params.textDocument, r.content, params.position),
                        range: params.context.selectedCompletionInfo?.range,
                        references: r.references?.map(r => ({
                            licenseName: r.licenseName,
                            referenceUrl: r.url,
                            referenceName: r.repository,
                            position: r.recommendationContentSpan && {
                                startCharacter: r.recommendationContentSpan.start,
                                endCharacter: r.recommendationContentSpan.end,
                            },
                        })),
                    }
                }
            )

            const completions: InlineCompletionListWithReferences = {
                items,
            }

            return completions
        }

        const onInlineCompletionHandler = async (
            params: InlineCompletionWithReferencesParams,
            _token: CancellationToken
        ): Promise<InlineCompletionListWithReferences> => {
            const completions: InlineCompletionListWithReferences = {
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
                        inferredLanguageId: languageId,
                    })
                    if (recommendations) {
                        if (includeSuggestionsWithCodeReferences) {
                            return recommendations
                        } else {
                            return {
                                items: recommendations.items.filter(
                                    i => i.references == null || i.references.length === 0
                                ),
                            }
                        }
                    }
                } catch (err) {
                    logging.log(`Recommendation failure: ${err}`)
                }
            }

            return completions
        }

        lsp.extensions.onInlineCompletionWithReferences(onInlineCompletionHandler)

        const updateConfiguration = async () =>
            lsp.workspace
                .getConfiguration('aws.codeWhisperer')
                .then(config => {
                    if (config && config['includeSuggestionsWithCodeReferences'] === false) {
                        includeSuggestionsWithCodeReferences = false
                        logging.log('Configuration updated to exclude suggestions with code references')
                    } else {
                        includeSuggestionsWithCodeReferences = true
                        logging.log('Configuration updated to include suggestions with code references')
                    }
                })
                .catch(reason => logging.log(`Error in GetConfiguration: ${reason}`))

        lsp.onInitialized(updateConfiguration)
        lsp.didChangeConfiguration(updateConfiguration)

        logging.log('Codewhisperer server has been initialised')

        return () => {
            /* do nothing */
        }
    }

export const CodeWhispererServerIAM = CodewhispererServerFactory(
    credentialsProvider => new CodeWhispererServiceIAM(credentialsProvider)
)
export const CodeWhispererServerToken = CodewhispererServerFactory(
    credentialsProvider => new CodeWhispererServiceToken(credentialsProvider)
)
