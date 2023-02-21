import { CompletionItem, CompletionList, Diagnostic, Hover, HoverParams, TextDocumentPositionParams } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { YamlLanguageService } from '../../../utils/yaml/service'
import { BaseLanguageService } from '../../types'

const SCHEMA_URL = 'https://d3rrggjwfhwld2.cloudfront.net/CodeBuild/buildspec/buildspec-standalone.schema.json'

export class BuildspecService extends BaseLanguageService {

    constructor(private readonly yaml: YamlLanguageService = new YamlLanguageService(SCHEMA_URL)) {
        super()
    }

    completion(document: TextDocument, textDocumentPositionParams: TextDocumentPositionParams): Promise<CompletionItem[] | CompletionList> {
        return this.yaml.completion(document, textDocumentPositionParams)
    }

    diagnostic(document: TextDocument): Promise<Diagnostic[]> {
        return this.yaml.diagnostic(document)
    }

    hover(document: TextDocument, params: HoverParams): Promise<Hover | null> {
        return this.yaml.hover(document, params)
    }
}
