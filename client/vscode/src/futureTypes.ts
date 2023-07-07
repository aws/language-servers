import { InlineCompletionContext, InlineCompletionItem, InlineCompletionList } from 'vscode'
import {
    ProtocolRequestType,
    StaticRegistrationOptions,
    TextDocumentPositionParams,
    TextDocumentRegistrationOptions,
    WorkDoneProgressOptions,
    WorkDoneProgressParams,
} from 'vscode-languageclient'

/**
 * Inline completion is not a part of the language server protocol.
 * It is being proposed at this time (https://github.com/microsoft/language-server-protocol/pull/1673).
 *
 * This file contains boilerplate code that goes away if that proposal goes mainline.
 * The proposal is being modelled after the VS Code extensibility APIs, so the types
 * used from `vscode` are compatible with what is being planned for future
 * `vscode-languageclient` types.
 *
 * See remarks in server\aws-lsp-codewhisperer\src\language-server\codeWhispererServer.ts
 * for more details.
 */

type InlineCompletionOptions = WorkDoneProgressOptions

type InlineCompletionRegistrationOptions = InlineCompletionOptions &
    TextDocumentRegistrationOptions &
    StaticRegistrationOptions

export type InlineCompletionParams = WorkDoneProgressParams &
    TextDocumentPositionParams & {
        context: InlineCompletionContext
    }

/**
 * inlineCompletionRequestType defines the custom method that the language client
 * requests from the server to provide inline completion recommendations.
 */
export const inlineCompletionRequestType = new ProtocolRequestType<
    InlineCompletionParams,
    InlineCompletionList | InlineCompletionItem[] | null,
    InlineCompletionItem[],
    void,
    InlineCompletionRegistrationOptions
>('aws/textDocument/inlineCompletion')
