// Partial port of implementation in AWS Toolkit for VSCode
// https://github.com/aws/aws-toolkit-vscode/blob/24840fda8559a3e3ace3517ad9844db76680dc50/packages/core/src/test/shared/filesystemUtilities.test.ts

import * as assert from 'assert'
import { getFileDistance } from './filesystem'

describe('filesystemUtilities', function () {
    describe('getFileDistance', function () {
        let fileA: string
        let fileB: string

        it('distance 0', function () {
            fileA = 'foo/bar/a.java'
            fileB = 'foo/bar/b.java'
            const actual = getFileDistance(fileA, fileB)
            assert.strictEqual(actual, 0)
        })

        it('root distance 0', function () {
            fileA = 'a.txt'
            fileB = 'b.txt'
            const actual = getFileDistance(fileA, fileB)
            assert.strictEqual(actual, 0)
        })

        it('distance 0 with whitespace', function () {
            fileA = 'foo/b%20ar/a.java'
            fileB = 'foo/b%20ar/b.java'
            const actual = getFileDistance(fileA, fileB)
            assert.strictEqual(actual, 0)
        })

        it('distance 1', function () {
            fileA = 'foo/bar/a.java'
            fileB = 'foo/b.java'
            const actual = getFileDistance(fileA, fileB)
            assert.strictEqual(actual, 1)
        })

        it('distance 3', function () {
            fileA = 'foo/bar/a.java'
            fileB = 'lzz/b.java'
            const actual = getFileDistance(fileA, fileB)
            assert.strictEqual(actual, 3)
        })

        it('distance 4', function () {
            fileA = 'foo/bar/a.java'
            fileB = 'lzz/baz/b.java'
            const actual = getFileDistance(fileA, fileB)
            assert.strictEqual(actual, 4)
        })

        it('another distance 4', function () {
            fileA = 'foo/a.py'
            fileB = 'foo/foo/foo/foo/foo/b.py'
            const actual = getFileDistance(fileA, fileB)
            assert.strictEqual(actual, 4)
        })

        it('distance 5', function () {
            fileA = 'foo/bar/a.java'
            fileB = 'lzz/baz/zoo/b.java'
            const actual = getFileDistance(fileA, fileB)
            assert.strictEqual(actual, 5)
        })

        it('distance 6', function () {
            fileA = 'foo/zoo/a.java'
            fileB = 'bar/baz/bee/bww/b.java'
            const actual = getFileDistance(fileA, fileB)
            assert.strictEqual(actual, 6)
        })

        it('distance 6 with whitespaces', function () {
            fileA = 'foo/zo%20o/a.java'
            fileB = 'bar/ba%20z/bee/bww/b.java'
            const actual = getFileDistance(fileA, fileB)
            assert.strictEqual(actual, 6)
        })

        it('backslash distance 1', function () {
            fileA = 'C:\\FOO\\BAR\\BAZ\\A.TXT'
            fileB = 'C:\\FOO\\BAR\\B.TXT'
            const actual = getFileDistance(fileA, fileB)
            assert.strictEqual(actual, 1)
        })

        it('backslash distnace 3', function () {
            fileA = 'C:\\FOO\\BAR\\BAZ\\LOO\\WOW\\A.txt'
            fileB = 'C:\\FOO\\BAR\\B.txt'
            const actual = getFileDistance(fileA, fileB)
            assert.strictEqual(actual, 3)
        })
    })
})
