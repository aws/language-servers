import { IamCredentials } from '@aws/language-server-runtimes-types'

export interface StsSession {
    profileName: string
    roleArn: string
    region?: string
}

export interface StsCache {
    getStsCredentials(clientName: string, stsSession: StsSession): Promise<IamCredentials>
    setStsCredentials(clientName: string, stsSession: StsSession, credentials: IamCredentials): Promise<void>
    removeStsCredentials(stsSessionName: string): Promise<void>
}

export class InMemoryStsCache implements StsCache {
    private cache = new Map<string, IamCredentials>()

    private getCacheKey(clientName: string, stsSession: StsSession): string {
        return `${clientName}:${stsSession.profileName}:${stsSession.roleArn}`
    }

    async getStsCredentials(clientName: string, stsSession: StsSession): Promise<IamCredentials> {
        const key = this.getCacheKey(clientName, stsSession)
        const credentials = this.cache.get(key)

        if (!credentials) {
            throw new Error('STS credentials not found in cache')
        }

        // Check if expired
        if (credentials.expiration && Date.now() >= credentials.expiration.getTime()) {
            this.cache.delete(key)
            throw new Error('STS credentials expired')
        }

        return credentials
    }

    async setStsCredentials(clientName: string, stsSession: StsSession, credentials: IamCredentials): Promise<void> {
        const key = this.getCacheKey(clientName, stsSession)
        this.cache.set(key, credentials)
    }

    async removeStsCredentials(stsSessionName: string): Promise<void> {
        // Remove all entries matching the session name
        for (const [key] of this.cache) {
            if (key.includes(stsSessionName)) {
                this.cache.delete(key)
            }
        }
    }
}
