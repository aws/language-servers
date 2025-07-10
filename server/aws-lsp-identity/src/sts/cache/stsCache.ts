import { AssumeRoleCommandOutput } from '@aws-sdk/client-sts'
import { DuckTyper } from '../../duckTyper'

export type StsCredential = Pick<AssumeRoleCommandOutput, 'Credentials' | 'AssumedRoleUser'>

export interface StsCache {
    getStsCredential(name: string): Promise<StsCredential | undefined>
    setStsCredential(name: string, credentials: StsCredential): Promise<void>
    removeStsCredential(name: string): Promise<void>
}

export const stsCredentialDuckTyper = new DuckTyper().requireProperty('Credentials').requireProperty('AssumedRoleUser')
