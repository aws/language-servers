import { StsCache } from './stsCache'
import { AwsError, Observability } from '@aws/lsp-core'
import { AwsErrorCodes, IamCredentials } from '@aws/language-server-runtimes/protocol'
import path, { join } from 'path'
import { mkdir, readFile, unlink, writeFile } from 'fs/promises'
import { getHomeDir } from '@smithy/shared-ini-file-loader'
import { throwOnInvalidCredentialId } from '../../iam/utils'

export class FileSystemStsCache implements StsCache {
    constructor(private readonly observability: Observability) {}

    async removeStsCredential(name: string): Promise<void> {
        throwOnInvalidCredentialId(name)

        await unlink(getStsCredentialFilepath(name)).catch(reason => this.ignoreDoesNotExistOrThrow(reason))
    }

    async getStsCredential(name: string): Promise<IamCredentials | undefined> {
        return await getStsCredentialFromFile(name)
            .then(credential => {
                if (
                    credential.accessKeyId &&
                    credential.secretAccessKey &&
                    credential.sessionToken &&
                    credential.expiration
                ) {
                    // Ensure Expiration is a Date object
                    if (typeof credential.expiration === 'string') {
                        credential = { ...credential, expiration: new Date(credential.expiration) }
                    }
                    return credential
                } else {
                    return undefined
                }
            })
            .catch(reason => this.ignoreDoesNotExistOrThrow(reason))
    }

    async setStsCredential(name: string, credential: IamCredentials): Promise<void> {
        if (
            !(credential.accessKeyId && credential.secretAccessKey && credential.sessionToken && credential.expiration)
        ) {
            this.observability.logging.log('Cannot set credential: missing fields.')
            return
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
