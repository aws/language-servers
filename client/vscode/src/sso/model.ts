/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

// For the Proof of concept, this file's code was copied from the AWS Toolkit for VS Code repo
// https://github.com/aws/aws-toolkit-vscode/blob/5d621c8405a8b20ffe571ad0ba10ae700178e051/src/auth/sso/model.ts

import * as vscode from 'vscode'

export interface SsoToken {
    /**
     * An optional identity associated with this token.
     */
    readonly identity?: string

    /**
     * A base64 encoded string returned by the SSO-OIDC service. This token must be treated as an
     * opaque UTF-8 string and must not be decoded.
     */
    readonly accessToken: string

    /**
     * The expiration time of the accessToken.
     */
    readonly expiresAt: Date

    /**
     * Should always be `Bearer` if present.
     */
    readonly tokenType?: string

    /**
     * Opaque token that may be used to 'refresh' the authentication session after expiration.
     */
    readonly refreshToken?: string
}

export interface ClientRegistration {
    /**
     * Unique registration id.
     */
    readonly clientId: string

    /**
     * Secret key associated with the registration.
     */
    readonly clientSecret: string

    /**
     * The expiration time of the registration.
     */
    readonly expiresAt: Date

    /**
     * Scope of the client registration. Applies to all tokens created using this registration.
     */
    readonly scopes?: string[]
}

export type LoginType = 'builderId' | 'idc'
export interface SsoProfile {
    readonly region: string
    readonly startUrl: string
    readonly accountId?: string
    readonly roleName?: string
    readonly scopes?: string[]
    readonly identifier?: string
    readonly loginType: LoginType
}

export const builderIdStartUrl = 'https://view.awsapps.com/start'
export const idcStartUrl = 'https://amzn.awsapps.com/start'

export async function openSsoPortalLink(
    startUrl: string,
    authorization: { readonly verificationUri: string; readonly userCode: string }
): Promise<boolean> {
    async function copyCodeAndOpenLink() {
        await vscode.env.clipboard.writeText(authorization.userCode).then(undefined, err => {
            // getLogger().warn(`auth: failed to copy user code "${authorization.userCode}" to clipboard: %s`, err)
        })

        return vscode.env.openExternal(vscode.Uri.parse(authorization.verificationUri))
    }

    async function showLoginNotification() {
        const name = startUrl === builderIdStartUrl ? 'BuilderID' : 'Identity Center'
        const title = `Copy Code for ${name}`
        const detail = `To proceed, open the login page and provide this code to confirm the access request: ${authorization.userCode}`

        const copyCode = 'Copy Code and Proceed'
        const options = { modal: true, detail } as vscode.MessageOptions

        while (true) {
            // TODO: add the 'Help' item back once we have a suitable URL
            // const resp = await vscode.window.showInformationMessage(title, options, copyCode, localizedText.help)
            const resp = await vscode.window.showInformationMessage(title, options, copyCode)
            switch (resp) {
                case copyCode:
                    return copyCodeAndOpenLink()
                default:
                    throw new Error('user cancelled')
            }
        }
    }

    return showLoginNotification()
}

// Most SSO 'expirables' are fairly long lived, so a one minute buffer is plenty.
const expirationBufferMs = 60000
export function isExpired(expirable: { expiresAt: Date }): boolean {
    return Date.now() + expirationBufferMs >= expirable.expiresAt.getTime()
}
