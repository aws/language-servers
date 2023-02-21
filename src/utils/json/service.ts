import { getLanguageService as getJsonLanguageService, LanguageService } from 'vscode-json-languageservice'

export type JsonLanguageService = LanguageService
export function createJsonLanguageService(): JsonLanguageService {
    return getJsonLanguageService({})
}
