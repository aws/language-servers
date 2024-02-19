import { ExtensionContext, commands } from 'vscode'
import { ExecuteCommandParams, ExecuteCommandRequest, LanguageClient } from 'vscode-languageclient/node'

export function registerLogCommand(languageClient: LanguageClient, extensionContext: ExtensionContext) {
    extensionContext.subscriptions.push(commands.registerCommand('helloWorld.log', logCommand(languageClient)))
}

export function logCommand(languageClient: LanguageClient) {
    return async () => {
        const request: ExecuteCommandParams = {
            command: '/helloWorld/log',
        }
        await languageClient.sendRequest(ExecuteCommandRequest.method, request)
        languageClient.info(`Client: The log command has been executed`)
    }
}
