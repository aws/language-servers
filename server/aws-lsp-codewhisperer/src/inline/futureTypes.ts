import { Command } from 'vscode-languageserver'
import { Range } from 'vscode-languageserver-textdocument'

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
 * 
 * This file contains types defined as part of the proposal.
 * They have been copied from https://github.com/microsoft/vscode-languageserver-node/pull/1190
 * Relating to code copied from the proposal PR... (via https://github.com/microsoft/vscode-languageserver-node/blob/main/License.txt)
Copyright (c) Microsoft Corporation

All rights reserved.

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy,
modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software
is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * A string value used as a snippet is a template which allows to insert text
 * and to control the editor cursor when insertion happens.
 *
 * A snippet can define tab stops and placeholders with `$1`, `$2`
 * and `${3:foo}`. `$0` defines the final tab stop, it defaults to
 * the end of the snippet. Variables are defined with `$name` and
 * `${name:default value}`.
 */
export interface StringValue {
    /**
     * The kind of string value.
     */
    kind: 'snippet'
    /**
     * The snippet string.
     */
    value: string
}

export namespace StringValue {
    export function create(value: string): StringValue {
        return { value, kind: 'snippet' }
    }
}

/**
 * An inline completion item represents a text snippet that is proposed inline to complete text that is being typed.
 */
export interface InlineCompletionItem {
    /**
     * The text to replace the range with. Must be set.
     */
    insertText: string | StringValue

    /**
     * A text that is used to decide if this inline completion should be shown. When `falsy` the {@link InlineCompletionItem.insertText} is used.
     */
    filterText?: string

    /**
     * The range to replace. Must begin and end on the same line.
     */
    range?: Range

    /**
     * An optional {@link Command} that is executed *after* inserting this completion.
     */
    command?: Command
}

export namespace InlineCompletionItem {
    export function create(
        insertText: string | StringValue,
        filterText?: string,
        range?: Range,
        command?: Command
    ): InlineCompletionItem {
        return { insertText, filterText, range, command }
    }
}

/**
 * Represents a collection of {@link InlineCompletionItem inline completion items} to be presented in the editor.
 */
export interface InlineCompletionList {
    /**
     * The inline completion items
     */
    items: InlineCompletionItem[]
}

export namespace InlineCompletionList {
    export function create(items: InlineCompletionItem[]): InlineCompletionList {
        return { items }
    }
}

/**
 * Describes how an {@link InlineCompletionItemProvider inline completion provider} was triggered.
 */
export namespace InlineCompletionTriggerKind {
    /**
     * Completion was triggered explicitly by a user gesture.
     */
    export const Invoked: 0 = 0

    /**
     * Completion was triggered automatically while editing.
     */
    export const Automatic: 1 = 1
}

export type InlineCompletionTriggerKind = 0 | 1

/**
 * Describes the currently selected completion item.
 */
export interface SelectedCompletionInfo {
    /**
     * The range that will be replaced if this completion item is accepted.
     */
    range: Range

    /**
     * The text the range will be replaced with if this completion is accepted.
     */
    text: string
}

export namespace SelectedCompletionInfo {
    export function create(range: Range, text: string): SelectedCompletionInfo {
        return { range, text }
    }
}

/**
 * Provides information about the context in which an inline completion was requested.
 */
export interface InlineCompletionContext {
    /**
     * Describes how the inline completion was triggered.
     */
    triggerKind: InlineCompletionTriggerKind

    /**
     * Provides information about the currently selected item in the autocomplete widget if it is visible.
     */
    selectedCompletionInfo?: SelectedCompletionInfo
}

export namespace InlineCompletionContext {
    export function create(
        triggerKind: InlineCompletionTriggerKind,
        selectedCompletionInfo?: SelectedCompletionInfo
    ): InlineCompletionContext {
        return { triggerKind, selectedCompletionInfo }
    }
}
