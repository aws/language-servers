import { commands, window } from 'vscode'
import { LanguageClient } from 'vscode-languageclient/node'
import {
    getConfigurationFromServerRequestType,
    updateConfigurationRequestType,
} from '@aws/language-server-runtimes/protocol'

export async function registerQProfileSelection(languageClient: LanguageClient): Promise<void> {
    commands.registerCommand(
        'aws.sample-vscode-ext-amazonq.selectProfile',
        queryAvailableProfilesAndSelect(languageClient)
    )

    commands.registerCommand(
        'aws.sample-vscode-ext-amazonq.updateProfileInvalid',
        setProfile(languageClient, 'invalid-profile')
    )

    commands.registerCommand('aws.sample-vscode-ext-amazonq.updateProfileNull', setProfile(languageClient, null))
}

function setProfile(languageClient: LanguageClient, profileArn: string | null) {
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

function queryAvailableProfilesAndSelect(languageClient: LanguageClient) {
    return async () => {
        try {
            const developerProfiles = await languageClient.sendRequest(getConfigurationFromServerRequestType.method, {
                section: 'aws.q.developerProfiles',
            })

            if (!(developerProfiles instanceof Array)) {
                languageClient.error('Retrieved developer profiles not an array, exiting.')
                return
            }

            let arns: string[] = []

            developerProfiles.forEach(profile => {
                const arn = profile.arn

                if (arn && typeof arn === 'string') {
                    arns.push(arn)
                }
            })

            if (arns.length < 1) {
                languageClient.error('Found no developer profiles, exiting.')
                return
            }

            const chosenProfile = await window.showQuickPick(arns, {
                placeHolder: 'Select profile arn',
            })

            if (!chosenProfile) return

            await setProfile(languageClient, chosenProfile)()
        } catch (err) {
            console.log('Error trying to select Q developer profile', err)
        }
    }
}
