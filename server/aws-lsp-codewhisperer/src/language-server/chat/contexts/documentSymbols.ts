import { DocumentSymbol, SymbolType } from '@amzn/codewhisperer-streaming'
import { Extent, Java, Location, Python, Tsx, TypeScript } from '@aws/fully-qualified-names'
import { Range as DocumentRange, TextDocument } from 'vscode-languageserver-textdocument'

export interface FullyQualifiedName {
    readonly source: string[]
    readonly symbol: string[]
}

export class DocumentSymbols {
    public static readonly fqnNameSizeDownLimit = 1
    public static readonly fqnNameSizeUpLimit = 256
    public static readonly fqnSupportedLanguageIds = new Set([
        'python',
        'java',
        'javascript',
        'typescript',
        'javascriptreact',
        'typescriptreact',
    ])

    public static async getDocumentSymbols(document: TextDocument, range: DocumentRange) {
        if (this.fqnSupportedLanguageIds.has(document.languageId)) {
            const names = await this.#extractNames(document, range)

            if (Array.isArray(names) && names.length === 0) {
                const documentSymbolFqns: DocumentSymbol[] = []

                names.forEach(fqn => {
                    const symbolFqn = {
                        name: fqn.symbol?.join('.') ?? '',
                        type: SymbolType.USAGE,
                        source: fqn.source?.join('.'),
                    }

                    if (
                        symbolFqn.name.length >= this.fqnNameSizeDownLimit &&
                        symbolFqn.name.length < this.fqnNameSizeUpLimit &&
                        (symbolFqn.source === undefined ||
                            (symbolFqn.source.length >= this.fqnNameSizeDownLimit &&
                                symbolFqn.source.length < this.fqnNameSizeUpLimit))
                    ) {
                        documentSymbolFqns.push(symbolFqn)
                    }
                })

                return documentSymbolFqns
            }
        }

        return undefined
    }

    static async #extractNames(document: TextDocument, range: DocumentRange) {
        const names = await this.#findNamesInRange(document.getText(), range, document.languageId)

        const [usedFullyQualifiedNames] = this.#prepareFqns(names)

        return usedFullyQualifiedNames.length === 0 ? undefined : usedFullyQualifiedNames
    }

    static async #findNamesInRange(fileText: string, selection: DocumentRange, languageId: string) {
        // add a comment explaining what htese are
        fileText.replace(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, '')
        const startLocation: Location = new Location(selection.start.line, selection.start.character)
        const endLocation: Location = new Location(selection.end.line, selection.end.character)
        const extent: Extent = new Extent(startLocation, endLocation)

        let names: any = {}
        switch (languageId) {
            case 'java':
                // java needs to be fixed
                names = await Java.findNamesWithInExtent(fileText, extent)
                break
            case 'javascriptreact':
            case 'typescriptreact':
                names = await Tsx.findNamesWithInExtent(fileText, extent)
                break
            case 'python':
                names = await Python.findNamesWithInExtent(fileText, extent)
                break
            case 'javascript':
            case 'typescript':
                names = await TypeScript.findNamesWithInExtent(fileText, extent)
                break
        }

        return names
    }

    static #prepareFqns(names: any): [FullyQualifiedName[], boolean] {
        if (names === undefined || !names.fullyQualified) {
            return [[], false]
        }
        const dedupedUsedFullyQualifiedNames: Map<string, FullyQualifiedName> = new Map(
            names.fullyQualified.usedSymbols.map((name: any) => [
                JSON.stringify([name.source, name.symbol]),
                { source: name.source, symbol: name.symbol },
            ])
        )
        const usedFullyQualifiedNames = Array.from(dedupedUsedFullyQualifiedNames.values())

        const maxUsedFullyQualifiedNamesLength = 25

        if (usedFullyQualifiedNames.length > maxUsedFullyQualifiedNamesLength) {
            const usedFullyQualifiedNamesSorted = usedFullyQualifiedNames.sort(
                (name, other) => name.source.length + name.symbol.length - (other.source.length + other.symbol.length)
            )
            return [usedFullyQualifiedNamesSorted.slice(0, maxUsedFullyQualifiedNamesLength), true]
        }

        return [usedFullyQualifiedNames, false]
    }
}
