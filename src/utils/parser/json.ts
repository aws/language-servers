import { JSONDocument, TextDocument } from 'vscode-json-languageservice'
import { createJsonLanguageService } from '../json/service'

const jsonService = createJsonLanguageService()

export function parseJson(td: TextDocument): JSONDocument {
    return jsonService.parseJSONDocument(td)
}
