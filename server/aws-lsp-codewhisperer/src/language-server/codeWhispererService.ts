import { AwsLanguageService } from '@lsp-placeholder/aws-lsp-core'
import { Credentials } from 'aws-sdk'
import { CancellationToken, CompletionItem, CompletionItemKind } from 'vscode-languageserver'
import { Position, Range, TextDocument, TextEdit } from 'vscode-languageserver-textdocument'
import { CompletionList, Diagnostic, FormattingOptions, Hover } from 'vscode-languageserver-types'
import { createCodeWhispererClient } from '../client/codewhisperer'
import { CodeWhispererTokenClientConfigurationOptions } from '../client/token/codewhisperer'
import {
    InlineCompletionContext,
    InlineCompletionItem,
    InlineCompletionList,
    InlineCompletionTriggerKind,
} from '../inline/futureTypes'
import CodeWhispererClient = require('../client/codewhispererclient')
import CodeWhispererTokenClient = require('../client/token/codewhispererclient')

export type CodeWhispererServiceProps = {
    displayName: string
    // HACK: connection is passed in for logging purposes
    // connection: Connection
    // credentialsProvider: CredentialsProvider
}

export interface CompletionParams {
    textDocument: TextDocument
    position: Position
    token: CancellationToken
}

interface DoInlineCompletionParams {
    textDocument: TextDocument
    position: Position
    context: InlineCompletionContext
    token: CancellationToken
}

interface GetRecommendationsParams {
    textDocument: TextDocument
    position: Position
    maxResults: number
    token: CancellationToken
}

export class CodeWhispererService implements AwsLanguageService {
    private readonly codeWhispererRegion = 'us-east-1'
    private readonly codeWhispererEndpoint = 'https://codewhisperer.us-east-1.amazonaws.com/'

    constructor(private readonly props: CodeWhispererServiceProps) {}

    isSupported(document: TextDocument): boolean {
        return true
    }

    async doComplete(textDocument: TextDocument, position: Position): Promise<CompletionList | null> {
        return this.doComplete2({ textDocument, position, token: CancellationToken.None })
    }

    // TODO : Design notes : We may want to change the AwsLanguageService signatures
    // to provide more details coming in through the LSP event.
    // In this case, we also want access to the cancellation token.
    async doComplete2(params: CompletionParams): Promise<CompletionList | null> {
        const recommendations = await this.getRecommendations({
            textDocument: params.textDocument,
            position: params.position,
            maxResults: 5,
            token: params.token,
        })

        let count = 1
        let items: CompletionItem[] = recommendations.map<CompletionItem>(r => {
            const itemId = count++

            return {
                // We don't just stick the recommendation into the completion list,
                // because multi-line recommendations don't render nicely.
                // Lean into the "documentation" instead to show the "preview"
                label: r.content,
                // label: `CodeWhispererRecommendation`,
                insertText: r.content,
                labelDetails: {
                    description: 'CodeWhisperer',
                    detail: ` (${itemId})`,
                },
                documentation: r.content,
                kind: CompletionItemKind.Snippet,
                // filterText: 'aaa CodeWhisperer',
            }
        })

        const completions: CompletionList = {
            isIncomplete: false,
            items,
        }

        return completions
    }

    // TODO : Design notes : What would the AwsLanguageService signature look like?
    async doInlineCompletion(params: DoInlineCompletionParams): Promise<InlineCompletionList | null> {
        const recommendations = await this.getRecommendations({
            textDocument: params.textDocument,
            position: params.position,
            maxResults: params.context.triggerKind == InlineCompletionTriggerKind.Automatic ? 1 : 5,
            token: params.token,
        })

        let items: InlineCompletionItem[] = recommendations.map<InlineCompletionItem>(r => {
            return {
                insertText: r.content,
                range: params.context.selectedCompletionInfo?.range,
            }
        })

        const completions: InlineCompletionList = {
            items,
        }

        return completions
    }

    // HACK : IAM vs Token response shapes are the same. We should use our own type, not CodeWhispererClient.Recommendation.
    private async getRecommendations(params: GetRecommendationsParams): Promise<CodeWhispererClient.Recommendation[]> {
        // This uses bearer tokens.
        // We'll need the language server to be able to query using the IAM based service client or the
        // bearer token based service client depending on what host the server is integrated with.
        // These are different clients, with different types.
        // Also, the IAM client has a generateRecommendations call, but the token client has a generateCompletions call.
        // This will need to be smoothed out later on.
        // I've left the IAM version's usage commented out below.
        // const bearerToken = (await this.props.credentialsProvider.resolveBearerToken(CancellationToken.None)).token
        // const bearerToken = (await this.props.credentialsProvider.resolveBearerToken(CancellationToken.None)).token

        const options: CodeWhispererTokenClientConfigurationOptions = {
            region: this.codeWhispererRegion,
            endpoint: this.codeWhispererEndpoint,
            credentials: new Credentials({ accessKeyId: 'xx', secretAccessKey: 'xx', sessionToken: 'xx' }),
            // onRequestSetup: [
            //     req => {
            //         req.on('build', ({ httpRequest }) => {
            //             console.log("http request ", httpRequest)
            //             // httpRequest.headers['Authorization'] = `Bearer ${bearerToken}`
            //         })
            //     },
            // ],
        }

        // CONCEPT: This is using the IAM credentials client.
        // We want to build up to using the bearer token client.
        const client = createCodeWhispererClient(options)
        // const client: CodeWhispererTokenClient = createCodeWhispererTokenClient(options)

        const left = params.textDocument.getText({
            start: { line: 0, character: 0 },
            end: params.position,
        })
        const right = params.textDocument.getText({
            start: params.position,
            end: params.textDocument.positionAt(params.textDocument.getText().length),
        })

        const request: CodeWhispererClient.GenerateRecommendationsRequest = {
            // const request: CodeWhispererTokenClient.GenerateCompletionsRequest = {
            fileContext: {
                filename: params.textDocument.uri,
                programmingLanguage: {
                    languageName: 'typescript',
                },
                leftFileContent: left,
                rightFileContent: right,
            },
            maxResults: params.maxResults,
        }

        const results: CodeWhispererClient.Recommendation[] = []

        // We will get all the paginated recommendations.
        // This is slow, and holds up the IDE's autocompletion list from showing.
        // We wouldn't do this in a release.
        do {
            if (params.token.isCancellationRequested) {
                // this.props.connection.console.info('*** CANCELLED ***')
                return []
            }

            const response = await client.generateRecommendations(request).promise()
            // const response = await client.generateCompletions(request).promise()

            request.nextToken = response.nextToken

            if (response.recommendations) {
                results.push(...response.recommendations)
            }
            // if (response.completions) {
            //     // HACK : IAM vs Token response shapes are the same. We should use our own type, not CodeWhispererClient.Recommendation.
            //     results.push(...response.completions)
            // }
        } while (request.nextToken !== undefined && request.nextToken !== '' && results.length < params.maxResults)

        return results
    }

    doValidation(textDocument: TextDocument): PromiseLike<Diagnostic[]> {
        throw new Error('Method not implemented.')
    }
    doHover(textDocument: TextDocument, position: Position): PromiseLike<Hover | null> {
        throw new Error('Method not implemented.')
    }
    format(textDocument: TextDocument, range: Range, options: FormattingOptions): TextEdit[] {
        throw new Error('Method not implemented.')
    }
}

export function create(props: CodeWhispererServiceProps): AwsLanguageService {
    return new CodeWhispererService(props)
}
