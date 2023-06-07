import { CompletionItem } from 'vscode-languageserver-types'

export function prependItemDetail(items: CompletionItem[], text: string): void {
    for (const item of items) {
        item.detail = item.detail!! ? `${text}: ${item.detail}` : text
    }
}
