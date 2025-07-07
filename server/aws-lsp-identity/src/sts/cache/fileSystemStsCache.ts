import { StsCache, StsCredential, stsCredentialDuckTyper } from './stsCache'
import { AwsError, Observability } from '@aws/lsp-core'
import { AwsErrorCodes } from '@aws/language-server-runtimes/protocol'
import path, { join } from 'path'
import { mkdir, readFile, unlink, writeFile } from 'fs/promises'
import { createHash } from 'crypto'
import { getHomeDir } from '@smithy/shared-ini-file-loader'

export class FileSystemStsCache implements StsCache {
    constructor(private readonly observability: Observability) {}

    async removeStsCredential(name: string): Promise<void> {
        await unlink(getStsCredentialFilepath(name)).catch(reason => this.ignoreDoesNotExistOrThrow(reason))
    }

    async getStsCredential(name: string): Promise<StsCredential | undefined> {
        return await getStsCredentialFromFile(name)
            .then(stsCredential => {
                if (stsCredentialDuckTyper.eval(stsCredential)) {
                    // Ensure Expiration is a Date object
                    if (typeof stsCredential.Credentials?.Expiration === 'string') {
                        stsCredential.Credentials.Expiration = new Date(stsCredential.Credentials.Expiration)
                    }
                    return stsCredential
                } else {
                    return undefined
                }
            })
            .catch(reason => this.ignoreDoesNotExistOrThrow(reason))
    }

    async setStsCredential(name: string, credentials: StsCredential): Promise<void> {
        if (!stsCredentialDuckTyper.eval(credentials)) {
            this.observability.logging.log('File read from STS cache is not an STS credential.')
            return
        }

        await writeStsObjectToFile(name, credentials).catch(reason => {
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
export function getStsCredentialFilepath(id: string) {
    const hasher = createHash('sha1')
    const cacheName = hasher.update(id).digest('hex')
    return join(getHomeDir(), '.aws', 'cli', 'cache', `${cacheName}.json`)
}

// Based on:
// https://github.com/smithy-lang/smithy-typescript/blob/main/packages/shared-ini-file-loader/src/getSSOTokenFromFile.ts
async function getStsCredentialFromFile(id: string) {
    const stsCredentialFilepath = getStsCredentialFilepath(id)
    const stsCredentialText = await readFile(stsCredentialFilepath, 'utf8')
    return JSON.parse(stsCredentialText) as StsCredential
}

// Based on:
// https://github.com/aws/aws-sdk-js-v3/blob/6e61f0e78ff7a9e3b1f2cd651bde5fc656d85ba9/packages/token-providers/src/writeSSOTokenToFile.ts
async function writeStsObjectToFile(id: string, credentials: StsCredential): Promise<void> {
    const filepath = getStsCredentialFilepath(id)
    await mkdir(path.dirname(filepath), { mode: 0o755, recursive: true })
    const json = JSON.stringify(credentials, null, 2)
    return await writeFile(filepath, json, { encoding: 'utf-8', flush: true, mode: 0o600 })
}

// Minimal declaration of SystemError (no node type declaration for it) to access code property
// https://nodejs.org/api/errors.html#class-systemerror
interface SystemError {
    code: string
}
