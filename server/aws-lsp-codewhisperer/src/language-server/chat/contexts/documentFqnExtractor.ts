import { DocumentSymbol, SymbolType } from '@amzn/codewhisperer-streaming'
import { FqnExtractorOutput, FullyQualifiedName, fqnExtractor } from '@aws/lsp-fqn'
import { Range, TextDocument } from 'vscode-languageserver-textdocument'
import { Features, Result } from '../../types'

export interface DocumentFqnExtractorConfig {
    nameMinLength?: number
    nameMaxLength?: number
    maxSymbols?: number
    timeout?: number
    logger?: Features['logging']
}

export type FqnSupportedLanagues =
    | 'python'
    | 'java'
    | 'javascript'
    | 'javascriptreact'
    | 'typescript'
    | 'typescriptreact'

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
    #timeout?: number

    #logger?: Features['logging']
    #disposeFunctionSet: Set<() => void>

    constructor(config?: DocumentFqnExtractorConfig) {
        const { nameMaxLength, nameMinLength, maxSymbols, timeout, logger } = config ?? {}
        this.#nameMinLength = nameMinLength ?? DocumentFqnExtractor.DEFAULT_CONFIG.nameMinLength
        this.#nameMaxLength = nameMaxLength ?? DocumentFqnExtractor.DEFAULT_CONFIG.nameMaxLength
        this.#maxSymbols = maxSymbols ?? DocumentFqnExtractor.DEFAULT_CONFIG.maxSymbols
        this.#timeout = timeout
        this.#logger = logger
        this.#disposeFunctionSet = new Set()
    }

    public dispose() {
        this.#disposeFunctionSet.forEach(disposeFunction => disposeFunction())
        this.#disposeFunctionSet.clear()
    }

    public async extractDocumentSymbols(
        document: TextDocument,
        range: Range,
        languageId = document.languageId
    ): Promise<DocumentSymbol[]> {
        return DocumentFqnExtractor.FQN_SUPPORTED_LANGUAGE_SET.has(languageId)
            ? this.#extractSymbols(document, range, languageId as FqnSupportedLanagues)
            : []
    }

    async #extractSymbols(document: TextDocument, range: Range, languageId: FqnSupportedLanagues) {
        const names = await this.#extractNames(document, range, languageId)

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
                    (symbolFqn.source.length >= this.#nameMinLength && symbolFqn.source.length < this.#nameMaxLength))
            ) {
                documentSymbols.push(symbolFqn)
            }
        }

        return documentSymbols
    }

    async #extractNames(
        document: TextDocument,
        range: Range,
        languageId: FqnSupportedLanagues
    ): Promise<FullyQualifiedName[]> {
        const result = await this.#findNamesInRange(document.getText(), range, languageId)

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
            (name, other) => name.source.length + name.symbol.length - (other.source.length + other.symbol.length)
        )
    }

    async #findNamesInRange(
        fileText: string,
        selection: Range,
        languageId: FqnSupportedLanagues
    ): Promise<Result<FqnExtractorOutput, string>> {
        const [resultPromise, dispose] = fqnExtractor(
            {
                fileText: fileText.replace(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, ''),
                selection,
                languageId,
            },
            {
                timeout: this.#timeout,
                logger: this.#logger
                    ? {
                          // binding for if log function (e.g. winston) relies on "this"
                          log: this.#logger.log.bind(this.#logger),
                          error: this.#logger.log.bind(this.#logger),
                      }
                    : undefined,
            }
        )

        this.#disposeFunctionSet.add(dispose)

        let result

        try {
            result = await resultPromise
        } finally {
            // remove reference to the dispose function
            this.#disposeFunctionSet.delete(dispose)
        }

        return result
    }
}
