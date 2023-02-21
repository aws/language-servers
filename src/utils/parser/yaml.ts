import { parse as parseYamlImpl } from 'yaml-language-server/out/server/src/languageservice/parser/yamlParser07'
import { YAMLDocument } from 'yaml-language-server/out/server/src/languageservice/parser/yaml-documents'
import { TextDocument } from 'vscode-languageserver-textdocument'

export function parseYaml(td: TextDocument): YAMLDocument {
    return parseYamlImpl(td.getText(), undefined, td)
}
