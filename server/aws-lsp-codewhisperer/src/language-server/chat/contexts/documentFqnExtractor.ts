import { DocumentSymbol, SymbolType } from '@amzn/codewhisperer-streaming'
import { ExtractorResult, FqnSupportedLanguages, FqnWorkerPool, FullyQualifiedName, IFqnWorkerPool } from '@aws/lsp-fqn'
import { Range, TextDocument } from 'vscode-languageserver-textdocument'
import { Cancellable, Features } from '../../types'

export interface DocumentFqnExtractorConfig {
    nameMinLength?: number
    nameMaxLength?: number
    maxSymbols?: number
    timeout?: number
    logger?: Features['logging']
}

export class DocumentFqnExtractor {
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

    #workerPool: IFqnWorkerPool

    constructor(config?: DocumentFqnExtractorConfig) {
        const { nameMaxLength, nameMinLength, maxSymbols, timeout, logger } = config ?? {}
        this.#nameMinLength = nameMinLength ?? DocumentFqnExtractor.DEFAULT_CONFIG.nameMinLength
        this.#nameMaxLength = nameMaxLength ?? DocumentFqnExtractor.DEFAULT_CONFIG.nameMaxLength
        this.#maxSymbols = maxSymbols ?? DocumentFqnExtractor.DEFAULT_CONFIG.maxSymbols
        this.#workerPool = new FqnWorkerPool({
            timeout,
            logger: logger
                ? {
                      // binding for log function (e.g. winston) that relies on "this"
                      log: logger.log.bind(logger),
                      error: logger.log.bind(logger),
                  }
                : undefined,
        })
    }

    public dispose() {
        this.#workerPool.dispose()
    }

    public extractDocumentSymbols(
        document: TextDocument,
        range: Range,
        languageId = document.languageId
    ): Cancellable<Promise<DocumentSymbol[]>> {
        return DocumentFqnExtractor.FQN_SUPPORTED_LANGUAGE_SET.has(languageId)
            ? this.#extractSymbols(document, range, languageId as FqnSupportedLanguages)
            : [Promise.resolve([]), () => {}]
    }

    #extractSymbols(
        document: TextDocument,
        range: Range,
        languageId: FqnSupportedLanguages
    ): Cancellable<Promise<DocumentSymbol[]>> {
        const [extractPromise, cancel] = this.#extractNames(document, range, languageId)

        return [
            extractPromise.then(names => {
                const documentSymbols: DocumentSymbol[] = []

                for (const name of names) {
                    if (documentSymbols.length >= this.#maxSymbols) {
                        break
                    }

                    const sourceSymbolString = name.source.join('.')
                    const symbolFqn = {
                        name: name.symbol.join('.') ?? '',
                        type: SymbolType.USAGE,
                        source: sourceSymbolString ? sourceSymbolString : undefined,
                    }

                    if (
                        symbolFqn.name.length >= this.#nameMinLength &&
                        symbolFqn.name.length < this.#nameMaxLength &&
                        (symbolFqn.source === undefined ||
                            (symbolFqn.source.length >= this.#nameMinLength &&
                                symbolFqn.source.length < this.#nameMaxLength))
                    ) {
                        documentSymbols.push(symbolFqn)
                    }
                }

                return documentSymbols
            }),
            cancel,
        ]
    }

    #extractNames(
        document: TextDocument,
        range: Range,
        languageId: FqnSupportedLanguages
    ): Cancellable<Promise<FullyQualifiedName[]>> {
        const [extractPromise, cancel] = this.#findNamesInRange(document.getText(), range, languageId)

        return [
            extractPromise.then(result => {
                if (!result.success || !result.data.fullyQualified) {
                    return []
                }

                const dedupedUsedFullyQualifiedNames: { [key: string]: FullyQualifiedName } = Object.fromEntries(
                    result.data.fullyQualified.usedSymbols.map((name: FullyQualifiedName) => [
                        JSON.stringify([name.source, name.symbol]),
                        { source: name.source, symbol: name.symbol },
                    ])
                )

                return Object.values(dedupedUsedFullyQualifiedNames).sort(
                    (name, other) =>
                        name.source.length + name.symbol.length - (other.source.length + other.symbol.length)
                )
            }),
            cancel,
        ]
    }

    #findNamesInRange(
        fileText: string,
        selection: Range,
        languageId: FqnSupportedLanguages
    ): Cancellable<Promise<ExtractorResult>> {
        return this.#workerPool.exec({
            /**
             * [\ue000-\uf8ff]: Private Use Area in Unicode
             * \ud83c[\udf00-\udfff]: Presentation Symbols
             * \ud83d[\udc00-\uddff]: Presentation Symbols
             */
            fileText: fileText.replace(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, ''),
            selection,
            languageId,
        })
    }
}
