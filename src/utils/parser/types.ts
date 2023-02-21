import { TextDocument } from 'vscode-languageserver-textdocument'
import { JSONDocument } from 'vscode-json-languageservice'
import { YAMLDocument } from 'yaml-language-server/out/server/src/languageservice/parser/yaml-documents'

export interface DocumentParserVisitor {
    parseYAML(td: TextDocument): YAMLDocument
    parseJSON(td: TextDocument): JSONDocument
}