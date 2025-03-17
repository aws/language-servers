import { commands } from 'vscode'
import { LanguageClient } from 'vscode-languageclient/node'
import { updateConfigurationRequestType } from '@aws/language-server-runtimes/protocol'

export async function registerQProfileSelection(languageClient: LanguageClient): Promise<void> {
    commands.registerCommand(
        'aws.sample-vscode-ext-amazonq.updateProfileIad',
        setProfile(languageClient, 'profile-iad')
    )
    commands.registerCommand(
        'aws.sample-vscode-ext-amazonq.updateProfileFra',
        setProfile(languageClient, 'profile-fra')
    )
    commands.registerCommand(
        'aws.sample-vscode-ext-amazonq.updateProfileInvalid',
        setProfile(languageClient, 'invalid-profile')
    )
}

function setProfile(languageClient: LanguageClient, profileArn: string) {
    return async () => {
        try {
            const result = await languageClient.sendRequest(updateConfigurationRequestType.method, {
                section: 'aws.q',
                settings: {
                    profileArn: profileArn,
                },
            })

            languageClient.info(`Client: Updated Amazon Q Profile`, result)
        } catch (err) {
            console.log('Error when setting Q Developer Profile', err)
        }
    }
}
