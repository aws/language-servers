import { getSSOTokenFilepath, getSSOTokenFromFile, SSOToken } from '@smithy/shared-ini-file-loader'
import { SsoCache, SsoClientRegistration, ssoClientRegistrationDuckTyper, ssoTokenDuckTyper } from './ssoCache'
import { mkdir, readFile, unlink, writeFile } from 'fs/promises'
import { AwsError } from '../../awsError'
import { AwsErrorCodes, SsoSession } from '@aws/language-server-runtimes/server-interface'
import { throwOnInvalidClientName, throwOnInvalidSsoSession, throwOnInvalidSsoSessionName } from '../utils'
import path from 'path'
import { Observability } from '../../language-server/utils'

// As this is a cache, we tend to swallow a lot of the errors as it is ok to just recreate the items each
// time, though recreating the SSO token without a refresh token will be every hour.  This is a better
// situation that failing to get an SSO token at all.

export class FileSystemSsoCache implements SsoCache {
    constructor(private readonly observability: Observability) {}

    async getSsoClientRegistration(
        clientName: string,
        ssoSession: SsoSession
    ): Promise<SsoClientRegistration | undefined> {
        const id = toSsoClientRegistrationCacheId(clientName, ssoSession)

        return await await getSsoClientRegistrationFromFile(id)
            .then(registration => (ssoClientRegistrationDuckTyper.eval(registration) ? registration : undefined))
            .catch(reason => ignoreDoesNotExistOrThrow(reason))
    }

    async setSsoClientRegistration(
        clientName: string,
        ssoSession: SsoSession,
        clientRegistration: SsoClientRegistration
    ): Promise<void> {
        const id = toSsoClientRegistrationCacheId(clientName, ssoSession)

        await writeSsoObjectToFile(id, clientRegistration).catch(reason => {
            throw AwsError.wrap(reason, AwsErrorCodes.E_CANNOT_WRITE_SSO_CACHE)
        })
    }

    async removeSsoToken(ssoSessionName: string): Promise<void> {
        throwOnInvalidSsoSessionName(ssoSessionName)

        await unlink(getSSOTokenFilepath(ssoSessionName)).catch(reason => ignoreDoesNotExistOrThrow(reason))
    }

    async getSsoToken(clientName: string, ssoSession: SsoSession): Promise<SSOToken | undefined> {
        throwOnInvalidSsoSession(ssoSession)

        return await getSSOTokenFromFile(ssoSession.name)
            .then(ssoToken => (ssoTokenDuckTyper.eval(ssoToken) ? ssoToken : undefined))
            .catch(reason => ignoreDoesNotExistOrThrow(reason))
    }

    async setSsoToken(clientName: string, ssoSession: SsoSession, ssoToken: SSOToken): Promise<void> {
        throwOnInvalidSsoSession(ssoSession)

        if (!ssoTokenDuckTyper.eval(ssoToken)) {
            return
        }

        await writeSsoObjectToFile(ssoSession.name, ssoToken).catch(reason => {
            throw AwsError.wrap(reason, AwsErrorCodes.E_CANNOT_WRITE_SSO_CACHE)
        })
    }
}

function ignoreDoesNotExistOrThrow(error: unknown): Promise<undefined> {
    // Error codes are consistent across OSes (Windows is converted to libuv error codes)
    // https://nodejs.org/api/errors.html#errorerrno
    if ((error as SystemError)?.code === 'ENOENT') {
        return Promise.resolve(undefined)
    }

    throw AwsError.wrap(error as Error, AwsErrorCodes.E_CANNOT_READ_SSO_CACHE)
}

function toSsoClientRegistrationCacheId(clientName: string, ssoSession: SsoSession): string {
    throwOnInvalidClientName(clientName)
    throwOnInvalidSsoSession(ssoSession)

    return JSON.stringify({
        region: ssoSession.settings.sso_region,
        startUrl: ssoSession.settings.sso_start_url,
        tool: clientName,
    })
}

// Based on:
// https://github.com/smithy-lang/smithy-typescript/blob/main/packages/shared-ini-file-loader/src/getSSOTokenFromFile.ts
async function getSsoClientRegistrationFromFile(id: string): Promise<SsoClientRegistration> {
    const filepath = getSSOTokenFilepath(id)
    const json = await readFile(filepath, 'utf8')
    return JSON.parse(json) as SsoClientRegistration
}

// Based on:
// https://github.com/aws/aws-sdk-js-v3/blob/6e61f0e78ff7a9e3b1f2cd651bde5fc656d85ba9/packages/token-providers/src/writeSSOTokenToFile.ts
async function writeSsoObjectToFile(id: string, ssoObject: SSOToken | SsoClientRegistration): Promise<void> {
    const filepath = getSSOTokenFilepath(id)
    await mkdir(path.dirname(filepath), { mode: 0o755, recursive: true })
    const json = JSON.stringify(ssoObject, null, 2)
    return await writeFile(filepath, json, { encoding: 'utf-8', flush: true, mode: 0o600 })
}

// Minimal declaration of SystemError (no node type declaration for it) to access code property
// https://nodejs.org/api/errors.html#class-systemerror
interface SystemError {
    code: string
}
