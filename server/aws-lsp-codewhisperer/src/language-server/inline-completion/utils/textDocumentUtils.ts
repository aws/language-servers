import { TextDocument } from '@aws/language-server-runtimes/server-interface'
import { ABAP_EXTENSIONS } from '../contants/constants'
import { URI } from 'vscode-uri'

export const getLanguageIdFromUri = (uri: string, logging?: any): string => {
    try {
        if (uri.startsWith('vscode-notebook-cell:')) {
            // use python for now as lsp does not support JL cell language detection
            return 'python'
        }
        const extension = uri.split('.').pop()?.toLowerCase()
        return ABAP_EXTENSIONS.has(extension || '') ? 'abap' : ''
    } catch (err) {
        logging?.log(`Error parsing URI to determine language: ${uri}: ${err}`)
        return ''
    }
}

export const getTextDocument = async (uri: string, workspace: any, logging: any): Promise<TextDocument | undefined> => {
    let textDocument = await workspace.getTextDocument(uri)
    if (!textDocument) {
        try {
            const content = await workspace.fs.readFile(URI.parse(uri).fsPath)
            const languageId = getLanguageIdFromUri(uri)
            textDocument = TextDocument.create(uri, languageId, 0, content)
        } catch (err) {
            logging.log(`Unable to load from ${uri}: ${err}`)
        }
    }
    return textDocument
}
