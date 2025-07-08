import { expect, use } from 'chai'
import { stub, restore } from 'sinon'
import * as processProvider from './processProvider'
import { AwsErrorCodes } from '@aws/language-server-runtimes/protocol'

// eslint-disable-next-line
use(require('chai-as-promised'))

describe('processProvider', () => {
    afterEach(() => {
        restore()
    })

    describe('getProcessCredentials', () => {
        it('returns credentials when process executes successfully', async () => {
            const mockCredentials = {
                AccessKeyId: 'my-access-key',
                SecretAccessKey: 'my-secret-key',
                SessionToken: 'my-session-token',
                Expiration: '2023-12-31T23:59:59Z',
            }

            stub(processProvider, 'execAsync').resolves({
                stdout: JSON.stringify(mockCredentials),
                stderr: '',
            })

            const result = await processProvider.getProcessCredentials('aws sts get-session-token')

            expect(result).to.deep.equal({
                accessKeyId: 'my-access-key',
                secretAccessKey: 'my-secret-key',
                sessionToken: 'my-session-token',
                expiration: '2023-12-31T23:59:59Z',
            })
        })

        it('returns credentials without expiration when not provided', async () => {
            const mockCredentials = {
                AccessKeyId: 'my-access-key',
                SecretAccessKey: 'my-secret-key',
                SessionToken: 'my-session-token',
            }

            stub(processProvider, 'execAsync').resolves({
                stdout: JSON.stringify(mockCredentials),
                stderr: '',
            })

            const result = await processProvider.getProcessCredentials('aws sts get-session-token')

            expect(result).to.deep.equal({
                accessKeyId: 'my-access-key',
                secretAccessKey: 'my-secret-key',
                sessionToken: 'my-session-token',
            })
        })

        it('throws error when stderr is present', async () => {
            stub(processProvider, 'execAsync').resolves({
                stdout: '{}',
                stderr: 'Error message',
            })

            await expect(processProvider.getProcessCredentials('invalid-command')).to.be.rejectedWith(
                'Failed to execute credential process',
                AwsErrorCodes.E_UNKNOWN
            )
        })
    })
})
