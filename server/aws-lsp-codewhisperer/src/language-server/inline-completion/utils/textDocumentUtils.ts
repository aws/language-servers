import { TextDocument } from '@aws/language-server-runtimes/server-interface'
import { ABAP_EXTENSIONS, EDITOR_STATE_MAX_LENGTH } from '../contants/constants'
import { URI } from 'vscode-uri'
import { Position } from 'vscode-languageserver-textdocument'
import { EditorState } from '@amzn/codewhisperer-runtime'

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

export const getEditorState = (textDocument: TextDocument, position: Position, languageName: string): EditorState => {
    // Build editorState with truncation for token-based requests
    const documentText = textDocument.getText()
    const cursorOffset = textDocument.offsetAt(position)
    let fileText = documentText
    if (documentText.length > EDITOR_STATE_MAX_LENGTH) {
        const halfLength = Math.floor(EDITOR_STATE_MAX_LENGTH / 2)
        const leftPart = documentText.substring(Math.max(0, cursorOffset - halfLength), cursorOffset)
        const rightPart = documentText.substring(cursorOffset, cursorOffset + halfLength)
        fileText = leftPart + rightPart
    }

    return {
        document: {
            relativeFilePath: textDocument.uri,
            programmingLanguage: {
                languageName: languageName,
            },
            text: fileText,
        },
        cursorState: {
            position: {
                line: position.line,
                character: position.character,
            },
        },
    }
}
