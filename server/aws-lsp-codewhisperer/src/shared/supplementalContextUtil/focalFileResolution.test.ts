/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { FocalFileResolver } from './focalFileResolution'

describe('focalFileResolver', function () {
    let sut: FocalFileResolver
    let tmpDir: string

    beforeEach(() => {
        sut = new FocalFileResolver()
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'focalFileResolutionTest-'))
    })

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true })
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

    describe('extractImportedPaths', function () {
        // TODO: seems not working as expected ?
        describe('java', function () {
            it('case1', function () {
                const p = path.join(tmpDir, 'FooTest.java')
                fs.writeFileSync(
                    p,
                    `
package com.amazon.q.service;

import com.amazon.q.foo.FooClass;
import com.amazon.q.bar.BarClass;
import com.amazon.q.baz1.baz2.BazClass;

public class TestClass {}
`
                )

                const actual = sut.extractImportedPaths(p, 'java', tmpDir)
                assert.strictEqual(actual.length, 1)
                assert.strictEqual(actual[0], 'com/amazon/q/service')
            })
        })

        // TODO: seems not working as expected ?
        describe('python', function () {
            it('case1', function () {
                const p = path.join(tmpDir, 'test_py_class.py')
                fs.writeFileSync(
                    p,
                    `
import pytest
import sys
import os
from py_class import PyClass
from util import {
    foo,
    bar,
    baz
}

def test_py_class():
    assert True
`
                )

                const actual = sut.extractImportedPaths(p, 'python', tmpDir)
                assert.strictEqual(actual.length, 5)
                assert.ok(actual.includes('py_class'))
                assert.ok(actual.includes('pytest'))
                assert.ok(actual.includes('sys'))
                assert.ok(actual.includes('os'))
                assert.ok(actual.includes('util'))
            })
        })

        describe('ts', function () {
            it('case1', function () {
                const p = path.join(tmpDir, 'src', 'test', 'foo.test.ts')
                fs.mkdirSync(path.join(tmpDir, 'src', 'test'), { recursive: true })
                fs.writeFileSync(
                    p,
                    `
import { foo } from '../foo';
import baz from '../baz';
import * as util from '../utils/util';

test('foo', () => {
    expect(foo()).toBe('foo');
});
`
                )

                const actual = sut.extractImportedPaths(p, 'typescript', tmpDir)
                assert.strictEqual(actual.length, 3)
                assert.ok(actual.includes(path.join(tmpDir, 'src', 'foo')))
                assert.ok(actual.includes(path.join(tmpDir, 'src', 'baz')))
                assert.ok(actual.includes(path.join(tmpDir, 'src', 'utils', 'util')))
            })
        })

        describe('js', function () {})
    })

    describe('extractImportedSymbols', function () {
        it('case1', function () {
            const p = path.join(tmpDir, 'foo.js')
            fs.writeFileSync(
                p,
                `
import { foo, bar } from '../src/sample';
import baz from '../src/sample';`
            )

            const actual = sut.extractImportedSymbols(p)
            assert.strictEqual(actual.length, 3)
            assert.ok(actual.includes('foo'))
            assert.ok(actual.includes('bar'))
            assert.ok(actual.includes('baz'))
        })
    })

    describe('extractExportedSymbolsFromFile', function () {})

    describe('resolveImportToAbsPath', function () {})

    describe('resolvePackageToPath', function () {
        it('dot', function () {
            const actual = sut.resolvePackageToPath('com.amazon.q.service', '.')
            assert.strictEqual(actual, path.join('com', 'amazon', 'q', 'service'))
        })

        it('slash', function () {
            const actual = sut.resolvePackageToPath('com/amazon/q/service', '/')
            assert.strictEqual(actual, path.join('com', 'amazon', 'q', 'service'))
        })
    })
})
