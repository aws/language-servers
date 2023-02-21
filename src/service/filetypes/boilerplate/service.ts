import { CompletionItem, CompletionList, Diagnostic, Hover, HoverParams, TextDocumentPositionParams } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { createJsonLanguageService, JsonLanguageService } from '../../../utils/json/service'
import { DocumentParser } from '../../../utils/parser/document'
import { DocumentParserVisitor } from '../../../utils/parser/types'
import { YamlLanguageService } from '../../../utils/yaml/service'
import { BaseLanguageService } from '../../types'

const SCHEMA_URL = 'https://my.website.com/schema.js'

export class BoilerplateService extends BaseLanguageService {

    private parser: DocumentParserVisitor
    private yaml: YamlLanguageService
    private json: JsonLanguageService

    constructor(
        parser: DocumentParserVisitor = new DocumentParser(),
        yaml: YamlLanguageService = new YamlLanguageService(SCHEMA_URL),
        json: JsonLanguageService = createJsonLanguageService()
    ) { 
        super()

        // Use this if you need an AST
        this.parser = parser

        // Use this if you need to access the YAML Language Service
        this.yaml = yaml

        // Use this if you need to access the JSON Language Service
        this.json = json
    }

    completion(document: TextDocument, textDocumentPositionParams: TextDocumentPositionParams): Promise<CompletionItem[] | CompletionList> {
        return Promise.resolve([])
    }

    diagnostic(document: TextDocument): Promise<Diagnostic[]> {
        return Promise.resolve([])
    }

    hover(document: TextDocument, params: HoverParams): Promise<Hover | null> {
        return Promise.resolve(null)
    }
}
