import { InitializeParams, WorkspaceFolder } from '@aws/language-server-runtimes/protocol'
import { Logging } from '@aws/language-server-runtimes/server-interface'
import * as path from 'path'
import { URI } from 'vscode-uri'

export function getWorkspaceFolders(logging: Logging, params?: InitializeParams): WorkspaceFolder[] {
    try {
        if (!params) {
            return []
        }
        const getFolderName = (uri: string) => path.basename(URI.parse(uri).fsPath) || 'workspace'
        if (params.workspaceFolders && params.workspaceFolders.length > 0) {
            return params.workspaceFolders
        }
        if (params.rootUri) {
            const folderName = getFolderName(params.rootUri)
            return [{ name: folderName, uri: params.rootUri }]
        }
        if (params.rootPath) {
            const pathUri = URI.parse(params.rootPath).toString()
            const folderName = getFolderName(pathUri)
            return [{ name: folderName, uri: pathUri }]
        }
        return []
    } catch (error) {
        logging.error(`Error occurred when determine workspace folders: ${error}`)
        return []
    }
}
