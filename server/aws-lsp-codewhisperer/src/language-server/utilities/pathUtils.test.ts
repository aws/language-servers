// Port of implementation in AWS Toolkit for VSCode
// https://github.com/aws/aws-toolkit-vscode/blob/24840fda8559a3e3ace3517ad9844db76680dc50/packages/core/src/test/shared/utilities/pathUtils.test.ts

import * as assert from 'assert'
import { normalizeSeparator, normalize } from './pathUtils'

describe.only('pathUtils', async function () {
    it('normalizeSeparator()', function () {
        assert.strictEqual(normalizeSeparator('a/b/c'), 'a/b/c')
        assert.strictEqual(normalizeSeparator('a\\b\\c'), 'a/b/c')
        assert.strictEqual(normalizeSeparator('a\\\\b\\c\\/\\'), 'a/b/c/')
        assert.strictEqual(normalizeSeparator('/a\\\\b\\c\\/\\/'), '/a/b/c/')
        assert.strictEqual(normalizeSeparator('//\\\\\\\\/\\//'), '/')
        assert.strictEqual(normalizeSeparator('a\\b\\c'), 'a/b/c')
        assert.strictEqual(normalizeSeparator('//////'), '/')
        assert.strictEqual(normalizeSeparator('//UNC///////path'), '//UNC/path')
        assert.strictEqual(normalizeSeparator('\\\\UNC\\path'), '//UNC/path')
        assert.strictEqual(normalizeSeparator('/'), '/')
        assert.strictEqual(normalizeSeparator(''), '')

        // Preserves double-slash at start (UNC path).
        assert.strictEqual(
            normalizeSeparator('\\\\codebuild\\tmp\\output\\js-manifest-in-root\\'),
            '//codebuild/tmp/output/js-manifest-in-root/'
        )
    })

    it('normalize()', function () {
        assert.strictEqual(normalize('../../FOO/BAR'), '../../FOO/BAR')
        assert.strictEqual(normalize('c:\\foo\\bar.txt'), 'C:/foo/bar.txt')
        assert.strictEqual(normalize('C:\\foo\\bar.txt'), 'C:/foo/bar.txt')
        assert.strictEqual(normalize('c:/foo/bar.txt'), 'C:/foo/bar.txt')
        assert.strictEqual(normalize('c:/foo'), 'C:/foo')
        assert.strictEqual(normalize('/foo/bar.txt'), '/foo/bar.txt')
        assert.strictEqual(normalize('/foo/bar'), '/foo/bar')
        assert.strictEqual(normalize('\\foo/bar\\'), '/foo/bar/')
        assert.strictEqual(normalize('/foo/'), '/foo/')
        assert.strictEqual(normalize('//////'), '/')
        assert.strictEqual(normalize('//UNC///////path'), '//UNC/path')
        assert.strictEqual(normalize('\\\\UNC\\path'), '//UNC/path')
        assert.strictEqual(normalize('/'), '/')
        assert.strictEqual(normalize(''), '')
        assert.strictEqual(normalize('a/b/c'), 'a/b/c')

        // Preserves double-slash at start (UNC path).
        assert.strictEqual(
            normalize('\\\\codebuild\\tmp\\output\\js-manifest-in-root\\'),
            '//codebuild/tmp/output/js-manifest-in-root/'
        )
    })
})
