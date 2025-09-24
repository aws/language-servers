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
