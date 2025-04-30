import { InitializeParams, WorkspaceFolder } from '@aws/language-server-runtimes/protocol'
import * as path from 'path'
import { URI } from 'vscode-uri'

export function getWorkspaceFolders(params?: InitializeParams): WorkspaceFolder[] {
    if (!params) {
        return []
    }
    const getFolderName = (uri: string) => path.posix.basename(URI.parse(uri).path) || 'workspace'
    if (params.workspaceFolders) {
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
}
