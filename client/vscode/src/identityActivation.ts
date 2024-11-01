import { commands, window } from 'vscode'
import {
    AwsBuilderIdSsoTokenSource,
    AwsResponseError,
    GetSsoTokenParams,
    getSsoTokenRequestType,
    GetSsoTokenResult,
    InvalidateSsoTokenParams,
    invalidateSsoTokenRequestType,
    ListProfilesParams,
    listProfilesRequestType,
    ProfileKind,
    SsoTokenChangedParams,
    ssoTokenChangedRequestType,
    SsoTokenSourceKind,
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

// The code here is for experimental purposes only.  Feel free to erase and replace
// what is here with whatever you're experimenting with.  If it is helpful to commit
// the code as a sample for future implementors to experiment as well, that is fine.
// If you want to keep a sample function call (or whatever the experiment is) long-term,
// you can add it as an additional function outside of this code so it can be maintained.
// Consider the code in this function a scratchpad, do not put anything you want to keep here.
// Put whatever calls to the aws-lsp-identity server you want to experiment with/debug here
async function execTestCommand(client: LanguageClient): Promise<void> {
    try {
        const result = await client.sendRequest(updateProfileRequestType.method, {
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
        } satisfies UpdateProfileParams)
        window.showInformationMessage(`UpdateProfile: ${JSON.stringify(result)}`)
    } catch (e) {
        const are = e as AwsResponseError
        window.showErrorMessage(`${are.message} [${are.data?.awsErrorCode}]`)
    }

    try {
        const result = await client.sendRequest(listProfilesRequestType.method, {} satisfies ListProfilesParams)
        window.showInformationMessage(`ListProfiles: ${JSON.stringify(result)}`)
    } catch (e) {
        const are = e as AwsResponseError
        window.showErrorMessage(`${are.message} [${are.data?.awsErrorCode}]`)
    }

    let ssoToken
    try {
        const result: GetSsoTokenResult = await client.sendRequest(getSsoTokenRequestType.method, {
            clientName: 'Flare test client',
            source: {
                kind: SsoTokenSourceKind.AwsBuilderId,
                ssoRegistrationScopes: ['codewhisperer:analysis', 'codewhisperer:completions'],
            } satisfies AwsBuilderIdSsoTokenSource,
            // source: {
            //     kind: SsoTokenSourceKind.IamIdentityCenter,
            //     profileName: 'my-idc-q',
            // } satisfies IamIdentityCenterSsoTokenSource,
        } satisfies GetSsoTokenParams)
        ssoToken = result.ssoToken
        window.showInformationMessage(`GetSsoToken: ${JSON.stringify(result)}`)
    } catch (e) {
        const are = e as AwsResponseError
        window.showErrorMessage(`${are.message} [${are.data?.awsErrorCode}]`)
    }

    try {
        await client.sendRequest(invalidateSsoTokenRequestType.method, {
            ssoTokenId: ssoToken?.id || 'my-idc-q',
        } satisfies InvalidateSsoTokenParams)
        window.showInformationMessage(`InvalidateSsoToken: successful`)
    } catch (e) {
        const are = e as AwsResponseError
        window.showErrorMessage(`${are.message} [${are.data?.awsErrorCode}]`)
    }
}
