import { StsCache } from './stsCache'
import { AwsError, Observability } from '@aws/lsp-core'
import { AwsErrorCodes, IamCredentials, Profile } from '@aws/language-server-runtimes/protocol'
import path, { join } from 'path'
import { mkdir, readFile, unlink, writeFile } from 'fs/promises'
import { getHomeDir } from '@smithy/shared-ini-file-loader'
import { throwOnInvalidCredentialId } from '../../iam/utils'
import { createHash } from 'crypto'

export class FileSystemStsCache implements StsCache {
    constructor(private readonly observability: Observability) {}

    async removeStsCredential(name: string): Promise<void> {
        throwOnInvalidCredentialId(name)

        await unlink(getStsCredentialFilepath(name)).catch(reason => this.ignoreDoesNotExistOrThrow(reason))
    }

    async getStsCredential(name: string): Promise<IamCredentials | undefined> {
        try {
            let credential = await getStsCredentialFromFile(name)
            if (!this.isValid(credential)) {
                this.observability.logging.log(`Cannot get credential from ${name}: missing fields.`)
                return undefined
            }
            // Ensure expiration is a Date object
            if (typeof credential.expiration === 'string') {
                credential = { ...credential, expiration: new Date(credential.expiration) }
            }
            if (this.isExpired(credential)) {
                this.observability.logging.log(`Credential from ${name} is expired`)
                return undefined
            }
            return credential
        } catch (e) {
            this.ignoreDoesNotExistOrThrow(e)
        }
    }

    async setStsCredential(name: string, credential: IamCredentials): Promise<void> {
        if (!this.isValid(credential)) {
            this.observability.logging.log('Cannot set credential: missing fields.')
            return
        }
        if (this.isExpired(credential)) {
            this.observability.logging.log(`Cannot set credential: expired`)
            return undefined
        }

        await writeStsObjectToFile(name, credential).catch(reason => {
            throw AwsError.wrap(reason, AwsErrorCodes.E_CANNOT_WRITE_SSO_CACHE)
        })
    }

    private ignoreDoesNotExistOrThrow(error: unknown): Promise<undefined> {
        // Error codes are consistent across OSes (Windows is converted to libuv error codes)
        // https://nodejs.org/api/errors.html#errorerrno
        if ((error as SystemError)?.code === 'ENOENT') {
            return Promise.resolve(undefined)
        }

        this.observability.logging.log('Cannot read STS cache.')
        throw AwsError.wrap(error as Error, AwsErrorCodes.E_CANNOT_READ_SSO_CACHE)
    }

    private isValid(credential: IamCredentials): boolean {
        return (
            credential.accessKeyId !== undefined &&
            credential.secretAccessKey !== undefined &&
            credential.sessionToken !== undefined &&
            credential.expiration !== undefined
        )
    }

    private isExpired(credential: IamCredentials): boolean {
        if (credential.expiration === undefined) {
            return false
        }
        return Date.now() >= credential.expiration.getTime()
    }
}

export function convertProfileToId(profile: Profile) {
    const key = JSON.stringify({
        RoleArn: profile.settings?.role_arn,
        RoleSessionName: profile.settings?.role_session_name,
        SerialNumber: profile.settings?.mfa_serial,
    })
    return createHash('sha1').update(key).digest('hex')
}

// Based on:
// https://github.com/smithy-lang/smithy-typescript/blob/main/packages/shared-ini-file-loader/src/getSSOTokenFilepath.ts
export function getStsCredentialFilepath(id: string): string {
    return join(getHomeDir(), '.aws', 'flare', 'cache', `${id}.json`)
}

// Based on:
// https://github.com/smithy-lang/smithy-typescript/blob/main/packages/shared-ini-file-loader/src/getSSOTokenFromFile.ts
async function getStsCredentialFromFile(id: string): Promise<IamCredentials> {
    const stsCredentialFilepath = getStsCredentialFilepath(id)
    const text = await readFile(stsCredentialFilepath, 'utf8')
    const json = JSON.parse(text)
    return {
        accessKeyId: json.Credentials.AccessKeyId,
        secretAccessKey: json.Credentials.SecretAccessKey,
        sessionToken: json.Credentials.SessionToken,
        expiration: json.Credentials.Expiration,
    } as IamCredentials
}

// Based on:
// https://github.com/aws/aws-sdk-js-v3/blob/6e61f0e78ff7a9e3b1f2cd651bde5fc656d85ba9/packages/token-providers/src/writeSSOTokenToFile.ts
async function writeStsObjectToFile(id: string, credentials: IamCredentials): Promise<void> {
    const filepath = getStsCredentialFilepath(id)
    await mkdir(path.dirname(filepath), { mode: 0o755, recursive: true })
    const json = JSON.stringify(
        {
            Credentials: {
                AccessKeyId: credentials.accessKeyId,
                SecretAccessKey: credentials.secretAccessKey,
                SessionToken: credentials.sessionToken,
                Expiration: credentials.expiration,
            },
        },
        null,
        2
    )
    return await writeFile(filepath, json, { encoding: 'utf-8', flush: true, mode: 0o600 })
}

// Minimal declaration of SystemError (no node type declaration for it) to access code property
// https://nodejs.org/api/errors.html#class-systemerror
interface SystemError {
    code: string
}
