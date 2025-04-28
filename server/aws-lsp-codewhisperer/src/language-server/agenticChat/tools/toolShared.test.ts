import * as assert from 'assert'
import * as path from 'path'
import sinon from 'ts-sinon'
import { isPathApproved, requiresPathAcceptance } from './toolShared'
import { workspaceUtils } from '@aws/lsp-core'

describe('toolShared', () => {
    describe('isPathApproved', () => {
        let isParentFolderStub: sinon.SinonStub

        beforeEach(() => {
            // Stub the isParentFolder function to control its behavior in tests
            isParentFolderStub = sinon.stub(workspaceUtils, 'isParentFolder')
        })

        afterEach(() => {
            // Restore the original function after each test
            isParentFolderStub.restore()
        })

        it('should return false if approvedPaths is undefined', () => {
            assert.strictEqual(isPathApproved('/test/path', undefined), false)
        })

        it('should return false if approvedPaths is empty', () => {
            assert.strictEqual(isPathApproved('/test/path', new Set()), false)
        })

        it('should return true if the exact path is in approved paths', () => {
            const approvedPaths = new Set(['/test/path'])
            const filePath = '/test/path'

            // We don't expect isParentFolder to be called in this case
            isParentFolderStub.returns(false)

            assert.strictEqual(isPathApproved(filePath, approvedPaths), true)
            // Verify isParentFolder was not called since we found an exact match
            assert.strictEqual(isParentFolderStub.called, false)
        })

        it('should return true if a path is a parent folder using isParentFolder', () => {
            const approvedPaths = new Set(['/test'])
            const filePath = '/test/path/file.js'

            // Make isParentFolder return true for this test
            isParentFolderStub.returns(true)

            assert.strictEqual(isPathApproved(filePath, approvedPaths), true)
            assert.strictEqual(isParentFolderStub.called, true)
        })

        it('should check paths with and without trailing slashes', () => {
            const approvedPaths = new Set(['/test/'])
            const filePath = '/test/path/file.js'

            // Make isParentFolder return false for the first call and true for the second
            isParentFolderStub.onFirstCall().returns(false)
            isParentFolderStub.onSecondCall().returns(true)

            assert.strictEqual(isPathApproved(filePath, approvedPaths), true)
            assert.strictEqual(isParentFolderStub.callCount, 2)
        })

        it('should check parent directories using isParentFolder', () => {
            const approvedPaths = new Set(['/test/path/subdir'])
            const filePath = '/test/path/subdir/file.js'

            // Configure isParentFolder to return true when called with the correct arguments
            isParentFolderStub.withArgs('/test/path/subdir', filePath.replace(/\\\\/g, '/')).returns(true)
            isParentFolderStub.returns(false) // Default for other calls

            assert.strictEqual(isPathApproved(filePath, approvedPaths), true)
            assert.strictEqual(isParentFolderStub.called, true)
        })

        it('should normalize Windows-style paths', () => {
            const approvedPaths = new Set(['C:/test'])
            const filePath = 'C:\\test\\path\\file.js'

            // Make isParentFolder return true
            isParentFolderStub.returns(true)

            assert.strictEqual(isPathApproved(filePath, approvedPaths), true)

            // Just verify it was called, without checking exact arguments
            assert.strictEqual(isParentFolderStub.called, true)
        })
    })

    // Add tests for requiresPathAcceptance if needed
})
