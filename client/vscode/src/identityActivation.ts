import { commands, window } from 'vscode'
import {
    listProfilesRequestType,
    ProfileKind,
    SsoTokenChangedParams,
    ssoTokenChangedRequestType,
    UpdateProfileParams,
    updateProfileRequestType,
} from '@aws/language-server-runtimes/protocol'

import { LanguageClient } from 'vscode-languageclient/node'

export async function registerIdentity(client: LanguageClient): Promise<void> {
    client.onNotification(ssoTokenChangedRequestType.method, ssoTokenChangedHandler)

    commands.registerCommand('aws.aws-lsp-identity.test', execTestCommand.bind(null, client))
}

function ssoTokenChangedHandler(params: SsoTokenChangedParams): void {
    window.showInformationMessage(`SsoTokenChanged raised: ${JSON.stringify(params)}`)
}

// Put whatever calls to the aws-lsp-identity server you want to experiment with/debug here
async function execTestCommand(client: LanguageClient): Promise<void> {
    const result1 = await client.sendRequest(updateProfileRequestType.method, {
        profile: {
            kinds: [ProfileKind.SsoTokenProfile],
            name: 'codecatalyst',
            settings: {
                region: 'us-west-2',
                sso_session: 'codecatalyst2',
            },
        },
        ssoSession: {
            name: 'codecatalyst2',
            settings: {
                sso_region: 'us-east-1',
                sso_start_url: 'https://view.awsapps.com/start',
                sso_registration_scopes: ['codecatalyst:read_write'],
            },
        },
    } as UpdateProfileParams)
    window.showInformationMessage(`UpdateProfile: ${JSON.stringify(result1)}`)

    const result2 = await client.sendRequest(listProfilesRequestType.method, {})
    window.showInformationMessage(`ListProfiles: ${JSON.stringify(result2)}`)
}
