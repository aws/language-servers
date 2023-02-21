import { JSONDocument } from 'vscode-json-languageservice'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { YAMLDocument } from 'yaml-language-server/out/server/src/languageservice/parser/yaml-documents'
import { parseJson } from './json'
import { DocumentParserVisitor } from './types'
import { parseYaml } from './yaml'

export class DocumentParser implements DocumentParserVisitor {
    parseYAML(td: TextDocument): YAMLDocument {
        return parseYaml(td)
    }
    parseJSON(td: TextDocument): JSONDocument {
        return parseJson(td)
    }
}
