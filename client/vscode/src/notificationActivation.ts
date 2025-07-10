import { CancellationToken, commands, window } from 'vscode'
import {
    AwsResponseError,
    notificationFollowupRequestType,
    NotificationParams,
    showNotificationRequestType,
} from '@aws/language-server-runtimes/protocol'

import {
    ConfigurationParams,
    ConfigurationRequest,
    DidChangeConfigurationNotification,
    LanguageClient,
    LSPAny,
} from 'vscode-languageclient/node'

// TODO-NOTIFY: Update this file to use showNotifications (plural) instead of showNotification (singular)
// after the protocol updates are implemented in language-server-runtimes
export async function registerNotification(client: LanguageClient): Promise<void> {
    client.onNotification(showNotificationRequestType.method, showNotificationHandler)
    //client.onRequest(ConfigurationRequest.method, onGetConfiguration)
    ;(client.middleware.workspace ||= {}).configuration = onGetConfiguration

    commands.registerCommand('aws.aws-lsp-notification.test', execTestCommand.bind(null, client))
}

function showNotificationHandler(params: NotificationParams): void {
    window.showInformationMessage(`ShowNotification raised: ${JSON.stringify(params)}`)
}

// The code here is for experimental purposes only.  Feel free to erase and replace
// what is here with whatever you're experimenting with.  If it is helpful to commit
// the code as a sample for future implementors to experiment as well, that is fine.
// If you want to keep a sample function call (or whatever the experiment is) long-term,
// you can add it as an additional function outside of this code so it can be maintained.
// Consider the code in this function a scratchpad, do not put anything you want to keep here.
// Put whatever calls to the aws-lsp-notification server you want to experiment with/debug here
async function execTestCommand(client: LanguageClient): Promise<void> {
    try {
        await sendDidChangeConfiguration(client)
        await sendNotificationFollowup(client)
    } catch (e) {
        const are = e as AwsResponseError
        window.showErrorMessage(`${are.message} [${are.data?.awsErrorCode}]`)
    }
}

function sendDidChangeConfiguration(client: LanguageClient): Promise<void> {
    return client.sendNotification(DidChangeConfigurationNotification.method, undefined)
}

function onGetConfiguration(
    params: ConfigurationParams,
    token: CancellationToken,
    next: ConfigurationRequest.HandlerSignature
): Promise<LSPAny[]> {
    return Promise.resolve(
        params.items[0]?.section == 'aws.notification.clientConfiguration'
            ? [
                  {
                      compute: {
                          type: 'desktop',
                          architecture: 'arm64',
                      },
                      os: {
                          type: 'darwin',
                          version: '24.3.0',
                      },
                      ide: {
                          type: 'vscode',
                          version: '1.97.2',
                      },
                      extension: {
                          type: 'Flare vscode sample client',
                          version: '0.0.1',
                      },
                      auth: {
                          type: 'sso',
                          region: 'us-east-1',
                          connectionState: 'connected',
                          ssoScopes: ['sso:account:access'],
                      },
                  },
              ]
            : []
    )
}

function sendNotificationFollowup(client: LanguageClient): Promise<void> {
    const id = '{"serverName":"AWS Toolkit Language Server for Notifications","id":"123"}'
    const encodedId = Buffer.from(id).toString('base64')
    client.info(`Triggering notification followup for id '${encodedId}'`)

    return client.sendNotification(notificationFollowupRequestType.method, {
        source: {
            id: encodedId,
        },
        action: 'Acknowledge',
    })
}
