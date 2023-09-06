import {
    InlineCompletionContext,
    InlineCompletionItem,
    InlineCompletionList,
    InlineCompletionTriggerKind,
} from '@aws-placeholder/aws-language-server-runtimes/out/features/lsp/inline-completions/futureTypes'
import { AwsLanguageService } from '@lsp-placeholder/aws-lsp-core'
import { AWSError, Credentials, Request } from 'aws-sdk'
import { CancellationToken, CompletionItem, CompletionItemKind } from 'vscode-languageserver'
import { Position, Range, TextDocument, TextEdit } from 'vscode-languageserver-textdocument'
import { CompletionList, Diagnostic, FormattingOptions, Hover } from 'vscode-languageserver-types'
import { createCodeWhispererClient } from '../client/codewhisperer'
import {
    CodeWhispererTokenClientConfigurationOptions,
    createCodeWhispererTokenClient,
} from '../client/token/codewhisperer'

import CodeWhispererClient = require('../client/codewhispererclient')
import CodeWhispererTokenClient = require('../client/token/codewhispererclient')

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

export abstract class CodeWhispererServiceBase implements AwsLanguageService {
    abstract client: CodeWhispererClient | CodeWhispererTokenClient

    // TODO : Design notes : We may want to change the AwsLanguageService signatures
    // to provide more details coming in through the LSP event.
    // In this case, we also want access to the cancellation token.
    async doComplete(
        textDocument: TextDocument,
        position: Position,
        token: CancellationToken = CancellationToken.None
    ): Promise<CompletionList | null> {
        const recommendations = await this.getRecommendations({
            textDocument: textDocument,
            position: position,
            maxResults: 5,
            token: token,
        })

        let count = 1
        let items: CompletionItem[] = recommendations.map<CompletionItem>(r => {
            const itemId = count++

            return {
                // This puts the complete recommendation into the completion list,
                // The UX isn't great
                label: r.content,
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
        // We'll need the language server to be able to query using the IAM based service client or the
        // bearer token based service client depending on what host the server is integrated with.
        // Also, the IAM client has a generateRecommendations call, but the token client has a generateCompletions call.
        // This will need to be smoothed out later on.

        const left = params.textDocument.getText({
            start: { line: 0, character: 0 },
            end: params.position,
        })
        const right = params.textDocument.getText({
            start: params.position,
            end: params.textDocument.positionAt(params.textDocument.getText().length),
        })

        const request: CodeWhispererClient.GenerateRecommendationsRequest = {
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
                return []
            }

            // const response = await this.client.generateRecommendations(request).promise()
            const response = await this.generateRecommendationsOrCompletions(request).promise()

            request.nextToken = response.nextToken

            if (response.recommendations) {
                results.push(...response.recommendations)
            }
        } while (request.nextToken !== undefined && request.nextToken !== '' && results.length < params.maxResults)

        return results
    }

    isSupported(document: TextDocument): boolean {
        return true
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

    abstract generateRecommendationsOrCompletions(
        request:
            | CodeWhispererTokenClient.GenerateCompletionsRequest
            | CodeWhispererClient.GenerateRecommendationsRequest
    ): Request<CodeWhispererClient.Types.GenerateRecommendationsResponse, AWSError>
}

export class CodeWhispererServiceIAM extends CodeWhispererServiceBase {
    client: CodeWhispererClient
    private readonly codeWhispererRegion = 'us-east-1'
    private readonly codeWhispererEndpoint = 'https://codewhisperer.us-east-1.amazonaws.com/'

    constructor() {
        super()
        const options: CodeWhispererTokenClientConfigurationOptions = {
            region: this.codeWhispererRegion,
            endpoint: this.codeWhispererEndpoint,
            credentials: new Credentials({
                accessKeyId: 'XX',
                secretAccessKey: 'XX',
                sessionToken: 'xx'
            }),
        }

        // CONCEPT: This is using the IAM credentials client.
        this.client = createCodeWhispererClient(options)
    }

    generateRecommendationsOrCompletions(
        request: CodeWhispererClient.GenerateRecommendationsRequest
    ): Request<CodeWhispererClient.GenerateRecommendationsResponse, AWSError> {
        return this.client.generateRecommendations(request)
    }
}

export class CodeWhispererServiceToken extends CodeWhispererServiceBase {
    client: CodeWhispererTokenClient
    private readonly codeWhispererRegion = 'us-east-1'
    private readonly codeWhispererEndpoint = 'https://codewhisperer.us-east-1.amazonaws.com/'

    constructor() {
        super()
        const options: CodeWhispererTokenClientConfigurationOptions = {
            region: this.codeWhispererRegion,
            endpoint: this.codeWhispererEndpoint,
            credentials: new Credentials({
                accessKeyId: 'XX',
                secretAccessKey: 'XX',
                sessionToken: 'xx'
            }),
        }

        this.client = createCodeWhispererTokenClient(options)
    }

    generateRecommendationsOrCompletions(
        request: CodeWhispererTokenClient.GenerateCompletionsRequest
    ): Request<CodeWhispererClient.GenerateRecommendationsResponse, AWSError> {
        return this.client.generateCompletions(request)
    }
}
