/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert'
import { IdeCredentialsProvider } from './ideCredentialsProvider'
import { IamCredentials } from './credentialsProvider'
import { Connection } from 'vscode-languageserver'
import * as sinon from 'sinon'

describe('IdeCredentialsProvider', function () {
    let provider: IdeCredentialsProvider
    let mockConnection: sinon.SinonStubbedInstance<Connection>

    beforeEach(function () {
        mockConnection = {
            console: {
                info: sinon.stub(),
                log: sinon.stub(),
                warn: sinon.stub(),
                error: sinon.stub(),
            },
        } as any
        provider = new IdeCredentialsProvider(mockConnection as any)
    })

    describe('validateIamCredentialsFields', function () {
        it('normalizes expireTime to expiration field', function () {
            const expireTime = new Date('2025-01-01')
            const credentials: IamCredentials & { expireTime?: Date } = {
                accessKeyId: 'key',
                secretAccessKey: 'secret',
                expireTime,
            }

            provider['validateIamCredentialsFields'](credentials)

            assert.strictEqual(credentials.expiration, expireTime)
        })

        it('keeps existing expiration field unchanged', function () {
            const expiration = new Date('2025-01-01')
            const credentials: IamCredentials = {
                accessKeyId: 'key',
                secretAccessKey: 'secret',
                expiration,
            }

            provider['validateIamCredentialsFields'](credentials)

            assert.strictEqual(credentials.expiration, expiration)
        })

        it('does not overwrite expiration when both fields exist', function () {
            const expiration = new Date('2025-01-01')
            const expireTime = new Date('2024-01-01')
            const credentials: IamCredentials & { expireTime?: Date } = {
                accessKeyId: 'key',
                secretAccessKey: 'secret',
                expiration,
                expireTime,
            }

            provider['validateIamCredentialsFields'](credentials)

            assert.strictEqual(credentials.expiration, expiration)
        })

        it('throws error when accessKeyId is missing', function () {
            const credentials = {
                secretAccessKey: 'secret',
            } as IamCredentials

            assert.throws(() => provider['validateIamCredentialsFields'](credentials), /Missing property: accessKeyId/)
        })

        it('throws error when secretAccessKey is missing', function () {
            const credentials = {
                accessKeyId: 'key',
            } as IamCredentials

            assert.throws(
                () => provider['validateIamCredentialsFields'](credentials),
                /Missing property: secretAccessKey/
            )
        })
    })
})
