import { InitializeParams, WorkspaceFolder } from '@aws/language-server-runtimes/protocol'
import { Logging } from '@aws/language-server-runtimes/server-interface'
import * as path from 'path'
import { URI } from 'vscode-uri'

export function getWorkspaceFolders(logging: Logging, params?: InitializeParams): WorkspaceFolder[] {
    if (!params) {
        return []
    }

    if (params.workspaceFolders && params.workspaceFolders.length > 0) {
        return params.workspaceFolders
    }
    try {
        const getFolderName = (parsedUri: URI) => path.basename(parsedUri.fsPath) || parsedUri.toString()

        if (params.rootUri) {
            const parsedUri = URI.parse(params.rootUri)
            const folderName = getFolderName(parsedUri)
            return [{ name: folderName, uri: params.rootUri }]
        }
        if (params.rootPath) {
            const parsedUri = URI.parse(params.rootPath)
            const folderName = getFolderName(parsedUri)
            return [{ name: folderName, uri: parsedUri.toString() }]
        }
        return []
    } catch (error) {
        logging.error(`Error occurred when determining workspace folders: ${error}`)
        return []
    }
}
