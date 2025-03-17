import { commands } from 'vscode'
import { LanguageClient } from 'vscode-languageclient/node'
import { getConfigurationFromServerRequestType } from '@aws/language-server-runtimes/protocol'

export async function registerAwsQSection(languageClient: LanguageClient): Promise<void> {
    commands.registerCommand('aws.sample-vscode-ext-amazonq.getAwsQSection', getAwsQSection(languageClient))
    commands.registerCommand('aws.sample-vscode-ext-amazonq.getCustomizations', getCustomizations(languageClient))
    commands.registerCommand('aws.sample-vscode-ext-amazonq.getDeveloperProfiles', getDeveloperProfiles(languageClient))
}

function getAwsQSection(languageClient: LanguageClient) {
    return async () => {
        const awsQSectionResult = await languageClient.sendRequest(getConfigurationFromServerRequestType.method, {
            section: 'aws.q',
        })

        languageClient.info(`Client: Received available data from AWS Q section: ${JSON.stringify(awsQSectionResult)}`)
    }
}

function getCustomizations(languageClient: LanguageClient) {
    return async () => {
        const customizationResult = await languageClient.sendRequest(getConfigurationFromServerRequestType.method, {
            section: 'aws.q.customizations',
        })

        languageClient.info(`Client: Received available customizations: ${JSON.stringify(customizationResult)}`)
    }
}

function getDeveloperProfiles(languageClient: LanguageClient) {
    return async () => {
        const developerProfiles = await languageClient.sendRequest(getConfigurationFromServerRequestType.method, {
            section: 'aws.q.developerProfiles',
        })

        languageClient.info(`Client: Received available Q developer profiles: ${JSON.stringify(developerProfiles)}`)
    }
}
