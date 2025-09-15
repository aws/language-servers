import { compactDecrypt } from 'jose'
import { ProgressLocation, commands, window } from 'vscode'
import {
    AwsResponseError,
    GetSsoTokenParams,
    GetSsoTokenProgress,
    GetSsoTokenProgressToken,
    GetSsoTokenProgressType,
    getSsoTokenRequestType,
    GetSsoTokenResult,
    IamIdentityCenterSsoTokenSource,
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

import {
    CancellationTokenSource,
    LanguageClient,
    MessageActionItem,
    ShowMessageRequest,
    ShowMessageRequestParams,
} from 'vscode-languageclient/node'
import { encryptionKey } from './credentialsActivation'

export async function registerIdentity(client: LanguageClient): Promise<void> {
    client.onNotification(ssoTokenChangedRequestType.method, ssoTokenChangedHandler)
    client.onTelemetry(e => window.showInformationMessage(`Telemetry: ${JSON.stringify(e)}`))

    client.onRequest<MessageActionItem | null, Error>(
        ShowMessageRequest.method,
        async (params: ShowMessageRequestParams) => {
            const actions = params.actions?.map(a => a.title) ?? []
            const response = await window.showInformationMessage(params.message, { modal: true }, ...actions)
            return params.actions?.find(a => a.title === response) ?? null
        }
    )

    let promise: Promise<void> | undefined
    let resolver: () => void = () => {}
    client.onProgress(GetSsoTokenProgressType, GetSsoTokenProgressToken, async (partialResult: GetSsoTokenProgress) => {
        const decryptedKey = await compactDecrypt(partialResult as unknown as string, encryptionKey)
        const val: GetSsoTokenProgress = JSON.parse(decryptedKey.plaintext.toString())

        if (val.state === 'InProgress') {
            if (promise) {
                resolver()
            }
            promise = new Promise<void>(resolve => {
                resolver = resolve
            })
        } else {
            resolver()
            promise = undefined
            return
        }

        window.withProgress(
            {
                cancellable: true,
                location: ProgressLocation.Notification,
                title: val.message,
            },
            () => promise!
        )
    })

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
        const cancellationTokenSource = new CancellationTokenSource()
        //setTimeout(() => cancellationTokenSource.cancel(), 500)

        const result: GetSsoTokenResult = await client.sendRequest(
            getSsoTokenRequestType.method,
            {
                clientName: 'Flare test client',
                // source: {
                //     kind: SsoTokenSourceKind.AwsBuilderId,
                //     ssoRegistrationScopes: ['codewhisperer:analysis', 'codewhisperer:completions'],
                // } satisfies AwsBuilderIdSsoTokenSource,
                source: {
                    kind: SsoTokenSourceKind.IamIdentityCenter,
                    profileName: 'eclipse-q-profile',
                } satisfies IamIdentityCenterSsoTokenSource,
                options: {
                    // authorizationFlow: 'Pkce',
                    authorizationFlow: 'DeviceCode',
                },
            } satisfies GetSsoTokenParams,
            cancellationTokenSource.token
        )
        ssoToken = result.ssoToken
        window.showInformationMessage(`GetSsoToken: ${JSON.stringify(result)}`)
    } catch (e) {
        const are = e as AwsResponseError
        window.showErrorMessage(`${are.message} [${are.data?.awsErrorCode}]`)
    }

    try {
        await client.sendRequest(invalidateSsoTokenRequestType.method, {
            ssoTokenId: ssoToken?.id || 'eclipse-q-profile',
        } satisfies InvalidateSsoTokenParams)
        window.showInformationMessage(`InvalidateSsoToken: successful`)
    } catch (e) {
        const are = e as AwsResponseError
        window.showErrorMessage(`${are.message} [${are.data?.awsErrorCode}]`)
    }
}
