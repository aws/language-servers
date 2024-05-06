import { DocumentSymbol, SymbolType } from '@amzn/codewhisperer-streaming'
import { Range as DocumentRange, TextDocument } from 'vscode-languageserver-textdocument'

export interface FullyQualifiedName {
    readonly source: string[]
    readonly symbol: string[]
}

export interface DocumentSymbolsExtractorConfig {
    nameMinLength?: number
    nameMaxLength?: number
    maxSymbols?: number
}
export class DocumentSymbolsExtractor {
    public static readonly DEFAULT_CONFIG = {
        nameMinLength: 1,
        nameMaxLength: 256,
        maxSymbols: 25,
    }

    public static readonly FQN_SUPPORTED_LANGUAGE_SET = new Set([
        'python',
        'java',
        'javascript',
        'typescript',
        'javascriptreact',
        'typescriptreact',
    ])

    #nameMinLength: number
    #nameMaxLength: number
    #maxSymbols: number

    constructor(config?: DocumentSymbolsExtractorConfig) {
        this.#nameMinLength = config?.nameMinLength ?? DocumentSymbolsExtractor.DEFAULT_CONFIG.nameMinLength
        this.#nameMaxLength = config?.nameMaxLength ?? DocumentSymbolsExtractor.DEFAULT_CONFIG.nameMaxLength
        this.#maxSymbols = config?.maxSymbols ?? DocumentSymbolsExtractor.DEFAULT_CONFIG.maxSymbols
    }

    public async extractDocumentSymbols(
        document: TextDocument,
        range: DocumentRange,
        languageId = document.languageId
    ): Promise<DocumentSymbol[]> {
        if (DocumentSymbolsExtractor.FQN_SUPPORTED_LANGUAGE_SET.has(languageId)) {
            return this.#extractSymbols(document, range)
        }

        return []
    }

    async #extractSymbols(document: TextDocument, range: DocumentRange) {
        const names = await this.#extractNames(document, range)

        const documentSymbols: DocumentSymbol[] = []

        for (const name of names) {
            if (documentSymbols.length >= this.#maxSymbols) {
                break
            }

            const symbolFqn = {
                name: name.symbol?.join('.') ?? '',
                type: SymbolType.USAGE,
                source: name.source?.join('.'),
            }

            if (
                symbolFqn.name.length >= this.#nameMinLength &&
                symbolFqn.name.length < this.#nameMaxLength &&
                (symbolFqn.source === undefined ||
                    (symbolFqn.source.length >= this.#nameMinLength && symbolFqn.source.length < this.#nameMaxLength))
            ) {
                documentSymbols.push(symbolFqn)
            }
        }

        return documentSymbols
    }

    async #extractNames(document: TextDocument, range: DocumentRange): Promise<FullyQualifiedName[]> {
        const names = await this.#findNamesInRange(document.getText(), range, document.languageId)

        if (!names?.fullyQualified) {
            return []
        }

        const dedupedUsedFullyQualifiedNames: { [key: string]: FullyQualifiedName } = Object.fromEntries(
            names.fullyQualified.usedSymbols.map((name: any) => [
                JSON.stringify([name.source, name.symbol]),
                { source: name.source, symbol: name.symbol },
            ])
        )

        const usedFullyQualifiedNames = Object.values(dedupedUsedFullyQualifiedNames)

        return usedFullyQualifiedNames.sort(
            (name, other) => name.source.length + name.symbol.length - (other.source.length + other.symbol.length)
        )
    }

    async #findNamesInRange(_fileText: string, _selection: DocumentRange, languageId: string): Promise<any> {
        // fileText.replace(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, '')
        // const startLocation: Location = new Location(selection.start.line, selection.start.character)
        // const endLocation: Location = new Location(selection.end.line, selection.end.character)
        // const extent: Extent = new Extent(startLocation, endLocation)

        switch (languageId) {
            // case 'java':
            //     // java needs to be fixed
            //     return Java.findNamesWithInExtent(fileText, extent)
            // case 'javascriptreact':
            // case 'typescriptreact':
            //     return Tsx.findNamesWithInExtent(fileText, extent)
            // case 'python':
            //     return Python.findNamesWithInExtent(fileText, extent)
            // case 'javascript':
            // case 'typescript':
            //     return TypeScript.findNamesWithInExtent(fileText, extent)
            default:
                return {}
        }
    }
}
