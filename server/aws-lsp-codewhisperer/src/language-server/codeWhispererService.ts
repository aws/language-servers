import { Auth } from '@aws-placeholder/aws-language-server-runtimes/out/features'
import { IamCredentials } from '@aws-placeholder/aws-language-server-runtimes/out/features/auth'
import {
    InlineCompletionContext,
    InlineCompletionItem,
    InlineCompletionList,
    InlineCompletionTriggerKind,
} from '@aws-placeholder/aws-language-server-runtimes/out/features/lsp/inline-completions/futureTypes'
import { AwsLanguageService } from '@lsp-placeholder/aws-lsp-core'
import { AWSError, Request } from 'aws-sdk'
import { CancellationToken, Range } from 'vscode-languageserver'
import { Position, TextDocument, TextEdit } from 'vscode-languageserver-textdocument'
import { CompletionList, Diagnostic, FormattingOptions, Hover } from 'vscode-languageserver-types'
import { createCodeWhispererClient } from '../client/codewhisperer'
import {
    CodeWhispererTokenClientConfigurationOptions,
    createCodeWhispererTokenClient,
} from '../client/token/codewhisperer'

import CodeWhispererClient = require('../client/codewhispererclient')
import CodeWhispererTokenClient = require('../client/token/codewhispererclient')

// Utility functions, to be moved out
/**
 * Returns the longest overlap between the Suffix of firstString and Prefix of second string
 * getPrefixSuffixOverlap("adwg31", "31ggrs") = "31"
 */
function getPrefixSuffixOverlap(firstString: string, secondString: string) {
    let i = Math.min(firstString.length, secondString.length)
    while (i > 0) {
        if (secondString.slice(0, i) === firstString.slice(-i)) {
            break
        }
        i--
    }
    return secondString.slice(0, i)
}

function truncateOverlapWithRightContext(document: TextDocument, suggestion: string, pos: Position): string {
    const trimmedSuggestion = suggestion.trim()
    // limit of 5000 for right context matching
    const rightContext = document.getText({ start: pos, end: document.positionAt(document.offsetAt(pos) + 5000) })
    const overlap = getPrefixSuffixOverlap(trimmedSuggestion, rightContext.trim())
    const overlapIndex = suggestion.lastIndexOf(overlap)
    if (overlapIndex >= 0) {
        const truncated = suggestion.slice(0, overlapIndex)
        return truncated.trim().length ? truncated : ''
    } else {
        return suggestion
    }
}

interface DoInlineCompletionParams {
    textDocument: TextDocument
    position: Position
    context: InlineCompletionContext
    token?: CancellationToken
    inferredLanguageId: string
}

interface GetRecommendationsParams {
    textDocument: TextDocument
    position: Position
    maxResults: number
    token: CancellationToken
    inferredLanguageId: string
}

export abstract class CodeWhispererServiceBase implements AwsLanguageService {
    abstract client: CodeWhispererClient | CodeWhispererTokenClient

    // TODO : Design notes : We may want to change the AwsLanguageService signatures
    // to provide more details coming in through the LSP event.
    // In this case, we also want access to the cancellation token.
    // For CWSPR LSP server, we might not need regular completion
    async doComplete(
        textDocument: TextDocument,
        position: Position,
        token: CancellationToken = CancellationToken.None
    ): Promise<CompletionList | null> {
        return null
    }

    // TODO : Design notes : What would the AwsLanguageService signature look like?
    async doInlineCompletion(params: DoInlineCompletionParams): Promise<InlineCompletionList | null> {
        const recommendations = await this.getRecommendations({
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
                    languageName: params.inferredLanguageId,
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

    constructor(auth: Auth) {
        super()
        if (!auth.hasCredentials('iam')) {
            throw new Error('IAM Credentials not provided')
        }

        const options: CodeWhispererTokenClientConfigurationOptions = {
            region: this.codeWhispererRegion,
            endpoint: this.codeWhispererEndpoint,
            credentials: auth.getCredentials('iam') as IamCredentials,
        }
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

    constructor(auth: Auth) {
        super()

        const options: CodeWhispererTokenClientConfigurationOptions = {
            region: this.codeWhispererRegion,
            endpoint: this.codeWhispererEndpoint,
            onRequestSetup: [
                req => {
                    req.on('build', ({ httpRequest }) => {
                        httpRequest.headers['Authorization'] = `Bearer ${auth.getCredentials('bearer')}`
                    })
                },
            ],
        }
        this.client = createCodeWhispererTokenClient(options)
    }

    generateRecommendationsOrCompletions(
        request: CodeWhispererTokenClient.GenerateCompletionsRequest
    ): Request<CodeWhispererClient.GenerateRecommendationsResponse, AWSError> {
        return this.client.generateCompletions(request)
    }
}
