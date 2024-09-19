import { commands } from 'vscode'
import { LanguageClient } from 'vscode-languageclient/node'
import { getConfigurationFromServerRequestType } from '@aws/language-server-runtimes/protocol'

export async function registerCustomizations(languageClient: LanguageClient): Promise<void> {
    commands.registerCommand('aws.amazonq.getCustomizations', getCustomizations(languageClient))
}

function getCustomizations(languageClient: LanguageClient) {
    return async () => {
        const customizationResult = await languageClient.sendRequest(getConfigurationFromServerRequestType.method, {
            section: 'aws.q',
        })

        languageClient.info(`Client: Received available customizations: ${JSON.stringify(customizationResult)}`)
    }
}
