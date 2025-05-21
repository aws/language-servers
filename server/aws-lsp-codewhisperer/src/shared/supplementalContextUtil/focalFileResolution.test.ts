/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert'
import { FocalFileResolver } from './focalFileResolution'

describe('focalFileResolver', function () {
    let sut: FocalFileResolver

    beforeEach(() => {
        sut = new FocalFileResolver()
    })

    describe('inferFocalFilename', function () {
        describe('java', function () {
            const testCases = [
                'FooTest.java',
                'FooTests.java',
                'TestFoo.java',
                // 'TestsFoo.java' // TODO: current implementation this case will fail
            ]

            for (let i = 0; i < testCases.length; i++) {
                const testCase = testCases[i]
                it(`should infer and return correct source focal file name case ${i}`, () => {
                    const result = sut.inferFocalFilename(testCase, 'java')
                    assert.strictEqual(result, 'Foo.java')
                })
            }
        })

        describe('python', function () {
            const testCases = ['test_py_class.py', 'py_class_test.py']

            for (let i = 0; i < testCases.length; i++) {
                const testCase = testCases[i]
                it(`should infer and return correct source focal file name case ${i}`, () => {
                    const result = sut.inferFocalFilename(testCase, 'python')
                    assert.strictEqual(result, 'py_class.py')
                })
            }
        })

        describe('js', function () {
            const testCases = ['foo.test.js', 'foo.spec.js']

            for (let i = 0; i < testCases.length; i++) {
                const testCase = testCases[i]
                it(`should infer and return correct source focal file name case ${i}`, () => {
                    const result = sut.inferFocalFilename(testCase, 'javascript')
                    assert.strictEqual(result, 'foo.js')
                })
            }
        })

        describe('ts', function () {
            const testCases = ['foo.test.ts', 'foo.spec.ts']

            for (let i = 0; i < testCases.length; i++) {
                const testCase = testCases[i]
                it(`should infer and return correct source focal file name case ${i}`, () => {
                    const result = sut.inferFocalFilename(testCase, 'typescript')
                    assert.strictEqual(result, 'foo.ts')
                })
            }
        })
    })
})
