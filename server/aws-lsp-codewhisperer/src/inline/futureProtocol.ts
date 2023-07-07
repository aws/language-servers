import {
    ProtocolRequestType,
    StaticRegistrationOptions,
    TextDocumentPositionParams,
    TextDocumentRegistrationOptions,
    WorkDoneProgressOptions,
    WorkDoneProgressParams,
} from 'vscode-languageserver'
import { InlineCompletionContext, InlineCompletionItem, InlineCompletionList } from './futureTypes'

/**
 * Inline completion is not a part of the language server protocol.
 * It is being proposed at this time (https://github.com/microsoft/language-server-protocol/pull/1673).
 *
 * This file contains boilerplate code that goes away if that proposal goes mainline, as
 * it would be a part of the `vscode-languageserver` package.
 *
 * The expectation would be that when inline completion becomes part of the
 * protocol standard, we have a low-friction transition, since there shouldn't be much drift
 * between these types, and the final standard's types.
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
