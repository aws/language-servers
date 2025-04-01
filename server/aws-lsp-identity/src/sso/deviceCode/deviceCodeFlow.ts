import {
    AwsErrorCodes,
    CancellationToken,
    MessageType,
    GetSsoTokenProgressState,
    GetSsoTokenProgressType,
    GetSsoTokenProgressToken,
} from '@aws/language-server-runtimes/server-interface'
import { SSOToken } from '@smithy/shared-ini-file-loader'
import {
    getSsoOidc,
    SsoFlowParams,
    throwOnInvalidClientRegistration,
    throwOnInvalidSsoSession,
    UpdateSsoTokenFromCreateToken,
} from '../utils'
import { AwsError, timeoutUtils } from '@aws/lsp-core'
import {
    AuthorizationPendingException,
    CreateTokenCommandOutput,
    SlowDownException,
    StartDeviceAuthorizationCommandOutput,
} from '@aws-sdk/client-sso-oidc'

const deviceGrantType = 'urn:ietf:params:oauth:grant-type:device_code'
const defaultExpiration = 10 * 60 * 1000
const responseTimeout = defaultExpiration
const backoffDelayMillis = 5000

export async function deviceCodeFlow(params: SsoFlowParams): Promise<SSOToken> {
    throwOnInvalidClientRegistration(params.clientRegistration)
    throwOnInvalidSsoSession(params.ssoSession)

    using oidc = getSsoOidc(params.ssoSession.settings.sso_region)

    const authorization = await oidc.startDeviceAuthorization({
        startUrl: params.ssoSession.settings.sso_start_url,
        clientId: params.clientRegistration.clientId,
        clientSecret: params.clientRegistration.clientSecret,
    })
    const expiresAt = new Date(
        (authorization.expiresIn ? authorization.expiresIn * 1000 : defaultExpiration) + Date.now()
    )

    // Sanity check
    if (!authorization.verificationUriComplete || !authorization.userCode || !authorization.deviceCode) {
        throw new AwsError('Device code authorization is invalid.', AwsErrorCodes.E_INVALID_SSO_CLIENT)
    }

    // Show auth code and URL to the user
    params.observability.logging.log(`Requesting ${params.clientName} to open SSO OIDC authorization login website.`)
    await showOnClient(params.handlers, authorization)

    // Wait for user to authenticate
    params.observability.logging.log('Waiting for user to verify authorization code...')
    let result
    try {
        result = await pollAuthorization(
            () =>
                oidc.createToken({
                    clientId: params.clientRegistration.clientId,
                    clientSecret: params.clientRegistration.clientSecret,
                    deviceCode: authorization.deviceCode,
                    grantType: deviceGrantType,
                }),
            expiresAt,
            params.token,
            authorization.interval ? authorization.interval * 1000 : undefined
        )
    } finally {
        // Tell the client to close the progress bar regardless
        params.handlers.showProgress(GetSsoTokenProgressType, GetSsoTokenProgressToken, {
            state: GetSsoTokenProgressState.Complete,
        })
    }

    params.observability.logging.log('Storing and returning created SSO token.')
    return UpdateSsoTokenFromCreateToken(result, params.clientRegistration, params.ssoSession)
}

function pollAuthorization(
    fn: () => Promise<CreateTokenCommandOutput>,
    expiresAt: Date,
    token: CancellationToken,
    intervalMillis: number = backoffDelayMillis
): Promise<CreateTokenCommandOutput> {
    // Monitor for cancellations requests from the client
    const cancellationPromise = new Promise<void>(resolve => {
        token.onCancellationRequested(() => resolve())
    })

    return (async function poll() {
        while (true) {
            if (expiresAt.getTime() - Date.now() <= intervalMillis) {
                throw new AwsError('Timed-out waiting for browser login flow to complete', AwsErrorCodes.E_TIMEOUT)
            }
            if (token.isCancellationRequested) {
                throw new AwsError(`Client cancelled the auth flow.`, AwsErrorCodes.E_CANCELLED)
            }

            try {
                return await fn()
            } catch (err) {
                if (err instanceof SlowDownException) {
                    intervalMillis += backoffDelayMillis
                } else if (!(err instanceof AuthorizationPendingException)) {
                    throw err
                }
            }

            // Re-evaluate after either receiving a cancellation or the interval time passes.
            await timeoutUtils.asyncCallWithTimeout(cancellationPromise, intervalMillis, '').catch((err: any) => {
                if (!(err instanceof timeoutUtils.AsyncTimeoutError)) {
                    throw err
                }
            })
        }
    })()
}

async function showOnClient(handlers: SsoFlowParams['handlers'], authorization: StartDeviceAuthorizationCommandOutput) {
    // Request to verify the code was seen.
    // If the user does nothing here (no client response), then we will eventually timeout.
    const response = await timeoutUtils
        .asyncCallWithTimeout(
            handlers.showMessageRequest({
                type: MessageType.Info,
                message: `Confirm code "${authorization.userCode}" in the login page opened in your web browser.`,
                actions: [
                    {
                        title: 'Proceed to Browser',
                    },
                ],
            }),
            responseTimeout,
            `Timed-out waiting for client message response to device code. Interval: ${responseTimeout}`
        )
        .catch((err: any) => {
            if (err instanceof timeoutUtils.AsyncTimeoutError) {
                throw new AwsError(`User code was not acknowledged.`, AwsErrorCodes.E_TIMEOUT)
            }

            // Client threw an error
            throw err
        })

    // Any response is acceptable
    if (!response) {
        throw new AwsError(`Auth flow was cancelled when displaying user code.`, AwsErrorCodes.E_CANCELLED)
    }

    // Show the login page
    handlers.showUrl(new URL(authorization.verificationUriComplete!))

    // Show a progress bar with the code
    handlers.showProgress(GetSsoTokenProgressType, GetSsoTokenProgressToken, {
        message: `Confirm code "${authorization.userCode}" in the login page opened in your web browser.`,
        state: GetSsoTokenProgressState.InProgress,
    })
}
