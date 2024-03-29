import { ExtensionContext, commands } from 'vscode'
import { ExecuteCommandParams, ExecuteCommandRequest, LanguageClient } from 'vscode-languageclient/node'

export function registerLogCommand(languageClient: LanguageClient, extensionContext: ExtensionContext) {
    extensionContext.subscriptions.push(commands.registerCommand('helloWorld.log', logCommand(languageClient)))
}

export function registerSecurityScanCommands(languageClient: LanguageClient, extensionContext: ExtensionContext) {
    extensionContext.subscriptions.push(
        commands.registerCommand('aws.codewhisperer.runSecurityScan', runSecurityScanCommand(languageClient))
    )
    extensionContext.subscriptions.push(
        commands.registerCommand('aws.codewhisperer.cancelSecurityScan', cancelSecurityScanCommand(languageClient))
    )
}

function logCommand(languageClient: LanguageClient) {
    return async () => {
        const request: ExecuteCommandParams = {
            command: '/helloWorld/log',
        }
        await languageClient.sendRequest(ExecuteCommandRequest.method, request)
        languageClient.info(`Client: The log command has been executed`)
    }
}

function runSecurityScanCommand(languageClient: LanguageClient) {
    return async () => {
        const request: ExecuteCommandParams = {
            command: 'aws/codewhisperer/runSecurityScan',
        }
        await languageClient.sendRequest(ExecuteCommandRequest.method, request)
        languageClient.info(`Client: The run security scan command has been executed`)
    }
}

function cancelSecurityScanCommand(languageClient: LanguageClient) {
    return async () => {
        const request: ExecuteCommandParams = {
            command: 'aws/codewhisperer/cancelSecurityScan',
        }
        await languageClient.sendRequest(ExecuteCommandRequest.method, request)
        languageClient.info(`Client: The cancel security scan command has been executed`)
    }
}
