import { commands } from 'vscode'
import { LanguageClient } from 'vscode-languageclient/node'
import { getConfigurationFromServerRequestType } from '@aws/language-server-runtimes/protocol'

export async function registerDeveloperProfiles(languageClient: LanguageClient): Promise<void> {
    commands.registerCommand('aws.sample-vscode-ext-amazonq.getDeveloperProfiles', getDeveloperProfiles(languageClient))
}

function getDeveloperProfiles(languageClient: LanguageClient) {
    return async () => {
        const developerProfiles = await languageClient.sendRequest(getConfigurationFromServerRequestType.method, {
            section: 'aws.q.developerProfiles',
        })

        languageClient.info(`Client: Received available Q developer profiles: ${JSON.stringify(developerProfiles)}`)
    }
}
