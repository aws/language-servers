import { getSSOTokenFilepath, getSSOTokenFromFile, SSOToken } from '@smithy/shared-ini-file-loader'
import { SsoCache, SsoClientRegistration, ssoClientRegistrationDuckTyper, ssoTokenDuckTyper } from './ssoCache'
import { readFile, writeFile } from 'fs/promises'
import { AwsError, tryAsync } from '../../awsError'
import { AwsErrorCodes } from '@aws/language-server-runtimes/protocol'

// As this is a cache, we tend to swallow a lot of the errors as it is ok to just recreate the items each
// time, though recreating the SSO token without a refresh token will be every hour.  This is a better
// situation that failing to get an SSO token at all.

export class FileSystemSsoCache implements SsoCache {
    async getSsoClientRegistration(
        clientName: string,
        ssoRegion: string,
        ssoStartUrl: string
    ): Promise<SsoClientRegistration | undefined> {
        const id = toSsoClientRegistrationCacheId(clientName, ssoRegion, ssoStartUrl)
        return await tryGetAsync(async () => {
            const registration = await getSsoClientRegistrationFromFile(id)
            return ssoClientRegistrationDuckTyper.eval(registration) ? registration : undefined
        })
    }

    async setSsoClientRegistration(
        clientName: string,
        ssoRegion: string,
        ssoStartUrl: string,
        clientRegistration: SsoClientRegistration
    ): Promise<void> {
        if (!clientName || !ssoRegion || !ssoStartUrl || !ssoClientRegistrationDuckTyper.eval(clientRegistration)) {
            return
        }

        const id = toSsoClientRegistrationCacheId(clientName, ssoRegion, ssoStartUrl)
        await tryAsync(
            () => writeSsoObjectToFile(id, clientRegistration),
            error => AwsError.wrap(error, AwsErrorCodes.E_CANNOT_WRITE_SSO_CACHE)
        )
    }

    async getSsoToken(ssoSessionName: string): Promise<SSOToken | undefined> {
        return await tryGetAsync(async () => {
            const ssoToken = await getSSOTokenFromFile(ssoSessionName)
            return ssoTokenDuckTyper.eval(ssoToken) ? ssoToken : undefined
        })
    }

    async setSsoToken(ssoSessionName: string, ssoToken: SSOToken): Promise<void> {
        if (!ssoSessionName || !ssoTokenDuckTyper.eval(ssoToken)) {
            return
        }

        tryAsync(
            () => writeSsoObjectToFile(ssoSessionName, ssoToken),
            error => AwsError.wrap(error, AwsErrorCodes.E_CANNOT_WRITE_SSO_CACHE)
        )
    }
}

async function tryGetAsync<R>(tryIt: () => Promise<R | undefined>): Promise<R | undefined> {
    try {
        return await tryIt()
    } catch (error) {
        // Error codes are consistent across OSes (Windows is converted to libuv error codes)
        // https://nodejs.org/api/errors.html#errorerrno
        if ((error as SystemError)?.code === 'ENOENT') {
            return Promise.resolve(undefined)
        }

        throw AwsError.wrap(error as Error, AwsErrorCodes.E_CANNOT_READ_SSO_CACHE)
    }
}

function toSsoClientRegistrationCacheId(clientName: string, ssoRegion: string, ssoStartUrl: string): string {
    return JSON.stringify({
        region: ssoRegion,
        startUrl: ssoStartUrl,
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
    try {
        const filepath = getSSOTokenFilepath(id)
        const json = JSON.stringify(ssoObject, null, 2)
        return await writeFile(filepath, json)
    } catch {
        // Writing to cache is best effort, based on:
        // https://github.com/aws/aws-sdk-js-v3/blob/main/packages/token-providers/src/fromSso.ts
    }
}

// Minimal declaration of SystemError (no node type declaration for it) to access code property
// https://nodejs.org/api/errors.html#class-systemerror
interface SystemError {
    code: string
}
