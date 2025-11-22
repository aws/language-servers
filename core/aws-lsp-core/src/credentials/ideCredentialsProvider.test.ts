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
            onRequest: sinon.stub(),
        } as any
        provider = new IdeCredentialsProvider(mockConnection as any)
    })

    describe('validateIamCredentialsFields', function () {
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

    describe('initialize', function () {
        it('registers credential push handlers when IAM credentials are provided', function () {
            const props = {
                credentials: {
                    providesIam: true,
                },
            }

            provider.initialize(props)

            assert(mockConnection.onRequest.called)
        })

        it('does not register handlers when no credentials config provided', function () {
            const props = {}

            provider.initialize(props)

            assert(!mockConnection.onRequest.called)
        })
    })

    describe('hasCredentials', function () {
        it('returns false when no credentials are set', function () {
            // IdeCredentialsProvider doesn't expose hasCredentials directly
            // Test through resolveIamCredentials instead
            assert.strictEqual(provider['pushedCredentials'], undefined)
            assert.strictEqual(provider['pushedToken'], undefined)
        })
    })

    describe('getCredentials', function () {
        it('throws NoCredentialsError when no credentials available', async function () {
            try {
                await provider.resolveIamCredentials({} as any)
                throw new Error('Expected error was not thrown')
            } catch (error) {
                assert.strictEqual((error as Error).constructor.name, 'NoCredentialsError')
            }
        })
    })
})
