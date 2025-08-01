import { IamCredentials } from '@aws/language-server-runtimes/protocol'

export interface StsCache {
    getStsCredential(name: string): Promise<IamCredentials | undefined>
    setStsCredential(name: string, credentials: IamCredentials): Promise<void>
    removeStsCredential(name: string): Promise<void>
}
