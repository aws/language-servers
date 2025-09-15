// Partial port of implementation in AWS Toolkit for VSCode
// https://github.com/aws/aws-toolkit-vscode/blob/24840fda8559a3e3ace3517ad9844db76680dc50/packages/core/src/test/shared/utilities/pathUtils.test.ts

import * as assert from 'assert'
import * as path from 'path'
import * as os from 'os'
import { normalizeSeparator, normalize, isInDirectory, sanitize } from './path'
import sinon from 'ts-sinon'

describe('pathUtils', async function () {
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

    it('isInDirectory()', function () {
        const basePath = path.join('this', 'is', 'the', 'way')
        const extendedPath = path.join(basePath, 'forward')
        const filename = 'yadayadayada.log'

        assert.ok(isInDirectory(basePath, basePath))
        assert.ok(isInDirectory(basePath, extendedPath))
        assert.ok(isInDirectory(basePath, path.join(basePath, filename)))
        assert.ok(isInDirectory(basePath, path.join(extendedPath, filename)))
        assert.ok(!isInDirectory(basePath, path.join('what', 'are', 'you', 'looking', 'at')))
        assert.ok(!isInDirectory(basePath, `${basePath}point`))
        assert.ok(isInDirectory('/foo/bar/baz/', '/foo/bar/baz/a.txt'))
        assert.ok(isInDirectory('/foo/bar/baz/', ''))
        assert.ok(isInDirectory('/', ''))
        assert.ok(isInDirectory('', 'foo'))
        assert.ok(isInDirectory('foo', 'foo'))

        if (os.platform() === 'win32') {
            assert.ok(isInDirectory('/foo/bar/baz/', '/FOO/BAR/BAZ/A.TXT'))
            assert.ok(isInDirectory('C:\\foo\\bar\\baz\\', 'C:/FOO/BAR/BAZ/A.TXT'))
            assert.ok(isInDirectory('C:\\foo\\bar\\baz', 'C:\\foo\\bar\\baz\\a.txt'))
        } else {
            assert.ok(!isInDirectory('/foo/bar/baz/', '/FOO/BAR/BAZ/A.TXT'))
        }
    })

    describe('sanitizePath', function () {
        let sandbox: sinon.SinonSandbox

        beforeEach(function () {
            sandbox = sinon.createSandbox()
        })

        afterEach(function () {
            sandbox.restore()
        })

        it('trims whitespace from input path', function () {
            const result = sanitize('  /test/path  ')
            assert.strictEqual(result, '/test/path')
        })

        it('expands tilde to user home directory', function () {
            const homeDir = '/Users/testuser'
            sandbox.stub(os, 'homedir').returns(homeDir)

            const result = sanitize('~/documents/file.txt')
            assert.strictEqual(result, path.join(homeDir, 'documents/file.txt'))
        })

        it('converts relative paths to absolute paths', function () {
            const result = sanitize('relative/path')
            assert.strictEqual(result, path.resolve('relative/path'))
        })

        it('leaves absolute paths unchanged', function () {
            const absolutePath = path.resolve('/absolute/path')
            const result = sanitize(absolutePath)
            assert.strictEqual(result, absolutePath)
        })
    })
})
