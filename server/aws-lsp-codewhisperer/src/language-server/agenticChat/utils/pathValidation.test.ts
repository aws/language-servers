/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs'
import * as assert from 'assert'
import sinon from 'ts-sinon'
import { validatePathBasic, validatePathExists, validatePaths } from './pathValidation'

describe('Path Validation Utilities', () => {
    let fsExistsSyncStub: sinon.SinonStub

    beforeEach(() => {
        fsExistsSyncStub = sinon.stub(fs, 'existsSync')
    })

    afterEach(() => {
        sinon.restore()
    })

    describe('validatePathBasic', () => {
        it('should not throw error for valid path', () => {
            assert.doesNotThrow(() => validatePathBasic('/valid/path'))
        })

        it('should throw error for empty path', () => {
            assert.throws(() => validatePathBasic(''), /Path cannot be empty./)
        })

        it('should throw error for path with only whitespace', () => {
            assert.throws(() => validatePathBasic('   '), /Path cannot be empty./)
        })

        it('should throw error for undefined path', () => {
            assert.throws(() => validatePathBasic(undefined as unknown as string), /Path cannot be empty./)
        })
    })

    describe('validatePathExists', () => {
        it('should not throw error when path exists', () => {
            fsExistsSyncStub.returns(true)
            assert.doesNotThrow(() => validatePathExists('/existing/path'))
            sinon.assert.calledWith(fsExistsSyncStub, '/existing/path')
        })

        it('should throw error when path does not exist', () => {
            fsExistsSyncStub.returns(false)
            assert.throws(
                () => validatePathExists('/non-existing/path'),
                /Path "\/non-existing\/path" does not exist or cannot be accessed./
            )
            sinon.assert.calledWith(fsExistsSyncStub, '/non-existing/path')
        })

        it('should throw error for empty path before checking existence', () => {
            assert.throws(() => validatePathExists(''), /Path cannot be empty./)
            sinon.assert.notCalled(fsExistsSyncStub)
        })
    })

    describe('validatePaths', () => {
        it('should not throw error for valid array of paths', () => {
            fsExistsSyncStub.returns(true)
            const paths = ['/path1', '/path2', '/path3']
            assert.doesNotThrow(() => validatePaths(paths))
            sinon.assert.callCount(fsExistsSyncStub, 3)
        })

        it('should throw error for empty array', () => {
            assert.throws(() => validatePaths([]), /Paths array cannot be empty./)
            sinon.assert.notCalled(fsExistsSyncStub)
        })

        it('should throw error for undefined array', () => {
            assert.throws(() => validatePaths(undefined), /Paths array cannot be empty./)
            sinon.assert.notCalled(fsExistsSyncStub)
        })

        it('should throw error if any path in array does not exist', () => {
            fsExistsSyncStub.onFirstCall().returns(true) // First path exists
            fsExistsSyncStub.onSecondCall().returns(false) // Second path doesn't exist
            fsExistsSyncStub.onThirdCall().returns(true) // Third path exists

            const paths = ['/path1', '/non-existing/path', '/path3']
            assert.throws(
                () => validatePaths(paths),
                /Path "\/non-existing\/path" does not exist or cannot be accessed./
            )
            sinon.assert.callCount(fsExistsSyncStub, 2) // Should stop at the first failing path
        })

        it('should throw error if any path in array is empty', () => {
            fsExistsSyncStub.returns(true)
            const paths = ['/path1', '', '/path3']
            assert.throws(() => validatePaths(paths), /Path cannot be empty./)
            sinon.assert.callCount(fsExistsSyncStub, 1) // Should stop at the first failing path
        })
    })
})
