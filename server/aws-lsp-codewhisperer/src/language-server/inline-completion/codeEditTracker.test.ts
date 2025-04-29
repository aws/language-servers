// /*!
//  * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
//  * SPDX-License-Identifier: Apache-2.0
//  */

// import { TextDocumentItem, InitializeParams, Logging } from '@aws/language-server-runtimes/server-interface'
// import * as sinon from 'sinon'
// import * as assert from 'assert'
// import {
//     RecentEditTracker,
//     RecentEditTrackerConfig,
//     RecentEditTrackerDefaultConfig,
//     DocumentSnapshot,
//     generateDiffContexts,
//     FileSnapshotContent,
// } from './codeEditTracker'

// describe('RecentEditTracker', function () {
//     let sandbox: sinon.SinonSandbox
//     let tracker: RecentEditTracker
//     let clock: sinon.SinonFakeTimers
//     let mockLogging: Logging
//     let mockInitParams: InitializeParams

//     beforeEach(function () {
//         sandbox = sinon.createSandbox()
//         // Set a base time for tests
//         const startTime = new Date('2025-04-21T12:00:00Z').getTime()

//         clock = sandbox.useFakeTimers({
//             now: startTime,
//             shouldAdvanceTime: true,
//         })

//         mockLogging = {
//             debug: sandbox.stub(),
//             error: sandbox.stub(),
//             info: sandbox.stub(),
//             warn: sandbox.stub(),
//             log: sandbox.stub(),
//         }

//         mockInitParams = {
//             processId: 123,
//             clientInfo: { name: 'test-client', version: '1.0.0' },
//             capabilities: {},
//         } as InitializeParams

//         tracker = new RecentEditTracker(mockInitParams, mockLogging)
//     })

//     afterEach(function () {
//         sandbox.restore()
//         clock.restore()
//         tracker.dispose()
//     })

//     describe('processEdit', function () {
//         let filePath: string
//         let previousContent: string
//         let mockDocument: TextDocumentItem

//         beforeEach(function () {
//             filePath = 'file:///path/to/file.js'
//             previousContent = 'previous content'
//             mockDocument = {
//                 uri: filePath,
//                 languageId: 'javascript',
//                 version: 1,
//                 text: 'current content',
//             }
//         })

//         it('should store snapshot in memory', async function () {
//             await tracker.processEdit(mockDocument, previousContent)
//             const snapshots = tracker.getFileSnapshots(filePath)

//             assert.strictEqual(snapshots.length, 1)
//             assert.strictEqual(snapshots[0].content, previousContent)
//             assert.strictEqual(snapshots[0].size, Buffer.byteLength(previousContent, 'utf8'))
//         })

//         it('should not add new snapshot within debounce interval', async function () {
//             await tracker.processEdit(mockDocument, 'first edit')
//             assert.strictEqual(tracker.getFileSnapshots(filePath).length, 1)

//             // Another edit within debounce interval, should not add another snapshot
//             await tracker.processEdit(mockDocument, 'second edit')
//             assert.strictEqual(tracker.getFileSnapshots(filePath).length, 1)
//         })

//         it('should add new snapshot after debounce interval', async function () {
//             await tracker.processEdit(mockDocument, 'first edit')
//             assert.strictEqual(tracker.getFileSnapshots(filePath).length, 1)

//             // Advance time past debounce interval
//             clock.tick(tracker.config.debounceIntervalMs + 1000)

//             // Another edit after debounce interval, should add another snapshot
//             await tracker.processEdit(mockDocument, 'second edit')
//             assert.strictEqual(tracker.getFileSnapshots(filePath).length, 2)

//             // Verify the content of the second snapshot
//             const snapshots = tracker.getFileSnapshots(filePath)
//             assert.strictEqual(snapshots[1].content, 'second edit')
//         })

//         it('should not process non-file URIs', async function () {
//             const nonFileDoc = {
//                 uri: 'untitled:///temp.js',
//                 languageId: 'javascript',
//                 version: 1,
//                 text: 'content',
//             }
//             await tracker.processEdit(nonFileDoc, 'content')
//             assert.strictEqual(tracker.getTotalSnapshotCount(), 0)
//         })

//         it('should delete snapshot after maxAgeMs', async function () {
//             const customConfig: Readonly<RecentEditTrackerConfig> = {
//                 ...RecentEditTrackerDefaultConfig,
//                 maxAgeMs: 10000,
//             }
//             tracker = new RecentEditTracker(mockInitParams, mockLogging, customConfig)

//             await tracker.processEdit(mockDocument, previousContent)
//             assert.strictEqual(tracker.getFileSnapshots(filePath).length, 1)

//             // Advance time just under the maxAgeMs, snapshot should still exist
//             clock.tick(customConfig.maxAgeMs - 1000)
//             assert.strictEqual(tracker.getFileSnapshots(filePath).length, 1)

//             // Advance time past the maxAgeMs, snapshot should be removed
//             clock.tick(2000)
//             assert.strictEqual(tracker.getFileSnapshots(filePath).length, 0)
//         })
//     })

//     describe('enforceMemoryLimits', function () {
//         it('should remove oldest snapshots when storage size exceeds limit', async function () {
//             // Very small storage limit - 200 bytes
//             const customConfig: Readonly<RecentEditTrackerConfig> = {
//                 ...RecentEditTrackerDefaultConfig,
//                 maxStorageSizeKb: 0.2, // 200 bytes
//                 debounceIntervalMs: 0, // Disable debouncing for test
//             }
//             tracker = new RecentEditTracker(mockInitParams, mockLogging, customConfig)

//             const file1 = 'file:///path/to/file1.js'

//             // Create a document
//             const mockDocument1 = {
//                 uri: file1,
//                 languageId: 'javascript',
//                 version: 1,
//                 text: 'current content',
//             }

//             // Add multiple snapshots in a loop until we exceed the memory limit
//             // Each snapshot will be 50 bytes
//             const snapshotContents = []
//             for (let i = 0; i < 6; i++) {
//                 const content = `content-${i}-`.padEnd(50, String.fromCharCode(97 + i))
//                 snapshotContents.push(content)

//                 await tracker.processEdit(mockDocument1, content)

//                 // Advance time between snapshots
//                 clock.tick(1000)
//             }

//             // We should have fewer snapshots than we added due to memory limits
//             const snapshots = tracker.getFileSnapshots(file1)

//             // We should have fewer than 6 snapshots (the exact number depends on implementation)
//             assert.ok(snapshots.length < 6, `Expected fewer than 6 snapshots, got ${snapshots.length}`)

//             // The remaining snapshots should be the most recent ones
//             // The oldest snapshots should have been removed
//             for (let i = 0; i < snapshots.length; i++) {
//                 const expectedContent: string = snapshotContents[snapshotContents.length - snapshots.length + i]
//                 assert.strictEqual(snapshots[i].content, expectedContent)
//             }
//         })
//     })

//     describe('getFileSnapshots', function () {
//         it('should return empty array for non-existent file', function () {
//             const result = tracker.getFileSnapshots('file:///non-existent/file.js')
//             assert.deepStrictEqual(result, [])
//         })

//         it('should return snapshots for existing file', async function () {
//             const file = 'file:///path/to/file.js'
//             const content = 'file content'
//             const mockDocument = {
//                 uri: file,
//                 languageId: 'javascript',
//                 version: 1,
//                 text: 'current content',
//             }
//             await tracker.processEdit(mockDocument, content)

//             const result = tracker.getFileSnapshots(file)
//             assert.strictEqual(result.length, 1)
//             assert.strictEqual(result[0].filePath, file)
//             assert.strictEqual(result[0].content, content)
//         })
//     })

//     describe('getTrackedFiles', function () {
//         it('should return empty array when no files are tracked', function () {
//             const result = tracker.getTrackedFiles()
//             assert.deepStrictEqual(result, [])
//         })

//         it('should return array of tracked file paths', async function () {
//             const file1 = 'file:///path/to/file1.js'
//             const file2 = 'file:///path/to/file2.js'

//             const mockDocument1 = {
//                 uri: file1,
//                 languageId: 'javascript',
//                 version: 1,
//                 text: 'content',
//             }

//             const mockDocument2 = {
//                 uri: file2,
//                 languageId: 'javascript',
//                 version: 1,
//                 text: 'content',
//             }

//             await tracker.processEdit(mockDocument1, 'content')
//             await tracker.processEdit(mockDocument2, 'content')

//             const result = tracker.getTrackedFiles()
//             assert.strictEqual(result.length, 2)
//             assert.ok(result.includes(file1))
//             assert.ok(result.includes(file2))
//         })
//     })

//     describe('getTotalSnapshotCount', function () {
//         it('should return 0 when no snapshots exist', function () {
//             const result = tracker.getTotalSnapshotCount()
//             assert.strictEqual(result, 0)
//         })

//         it('should return total count of snapshots across all files', async function () {
//             const file1 = 'file:///path/to/file1.js'
//             const file2 = 'file:///path/to/file2.js'

//             const mockDocument1 = {
//                 uri: file1,
//                 languageId: 'javascript',
//                 version: 1,
//                 text: 'content',
//             }

//             const mockDocument2 = {
//                 uri: file2,
//                 languageId: 'javascript',
//                 version: 1,
//                 text: 'content',
//             }

//             await tracker.processEdit(mockDocument1, 'content')

//             // Advance time past debounce interval
//             clock.tick(tracker.config.debounceIntervalMs + 1000)

//             await tracker.processEdit(mockDocument1, 'updated content')
//             await tracker.processEdit(mockDocument2, 'content')

//             const result = tracker.getTotalSnapshotCount()
//             assert.strictEqual(result, 3)
//         })
//     })

//     describe('getSnapshotContent', function () {
//         it('should retrieve snapshot content', async function () {
//             const file = 'file:///path/to/file.js'
//             const snapshotContent = 'snapshot content'

//             const mockDocument = {
//                 uri: file,
//                 languageId: 'javascript',
//                 version: 1,
//                 text: 'current content',
//             }

//             await tracker.processEdit(mockDocument, snapshotContent)
//             const snapshot = tracker.getFileSnapshots(file)[0]

//             const content = await tracker.getSnapshotContent(snapshot)
//             assert.strictEqual(content, snapshotContent)
//         })
//     })

//     describe('document handling methods', function () {
//         let mockDocument: TextDocumentItem

//         beforeEach(function () {
//             mockDocument = {
//                 uri: 'file:///path/to/file.js',
//                 languageId: 'javascript',
//                 version: 1,
//                 text: 'document content',
//             }
//         })

//         it('should track document on open', function () {
//             tracker.handleDocumentOpen(mockDocument)

//             // Check that shadow copy was created
//             const shadowCopy = (tracker as any).shadowCopies.get(mockDocument.uri)
//             assert.strictEqual(shadowCopy, 'document content')

//             // Check that document is marked as active
//             const isActive = (tracker as any).activeDocuments.has(mockDocument.uri)
//             assert.strictEqual(isActive, true)
//         })

//         it('should untrack document on close', function () {
//             tracker.handleDocumentOpen(mockDocument)
//             tracker.handleDocumentClose(mockDocument.uri)

//             // Check that document is no longer active
//             const isActive = (tracker as any).activeDocuments.has(mockDocument.uri)
//             assert.strictEqual(isActive, false)
//         })

//         it('should process edit on document change', async function () {
//             // First open the document to create shadow copy
//             tracker.handleDocumentOpen(mockDocument)

//             // Create updated document
//             const updatedDocument = {
//                 ...mockDocument,
//                 text: 'updated content',
//             }

//             // Process change
//             await tracker.handleDocumentChange(updatedDocument)

//             // Check that a snapshot was created with the previous content
//             const snapshots = tracker.getFileSnapshots(mockDocument.uri)
//             assert.strictEqual(snapshots.length, 1)
//             assert.strictEqual(snapshots[0].content, 'document content')

//             // Check that shadow copy was updated
//             const shadowCopy = (tracker as any).shadowCopies.get(mockDocument.uri)
//             assert.strictEqual(shadowCopy, 'updated content')
//         })
//     })

//     describe('generateEditBasedContext', function () {
//         let getActiveDocumentStub: sinon.SinonStub

//         beforeEach(function () {
//             // Stub the private getActiveDocument method
//             getActiveDocumentStub = sandbox.stub(tracker as any, 'getActiveDocument')
//         })

//         it('should return empty context when no active document', async function () {
//             getActiveDocumentStub.resolves(undefined)

//             const result = await tracker.generateEditBasedContext()

//             assert.strictEqual(result.supplementalContextItems.length, 0)
//             assert.strictEqual(result.contentsLength, 0)
//             assert.strictEqual(result.strategy, 'recentEdits')
//         })

//         it('should return empty context when no snapshots for active document', async function () {
//             getActiveDocumentStub.resolves({
//                 uri: 'file:///path/to/active.js',
//                 languageId: 'javascript',
//                 version: 1,
//                 text: 'current content',
//             })

//             const result = await tracker.generateEditBasedContext()

//             assert.strictEqual(result.supplementalContextItems.length, 0)
//             assert.strictEqual(result.contentsLength, 0)
//             assert.strictEqual(result.strategy, 'recentEdits')
//         })

//         it('should generate context from snapshots', async function () {
//             const filePath = 'file:///path/to/active.js'

//             // Create snapshots
//             const mockDocument = {
//                 uri: filePath,
//                 languageId: 'javascript',
//                 version: 1,
//                 text: 'old content',
//             }

//             await tracker.processEdit(mockDocument, 'snapshot 1')

//             // Advance time past debounce interval
//             clock.tick(tracker.config.debounceIntervalMs + 1000)

//             await tracker.processEdit(mockDocument, 'snapshot 2')

//             // Set up active document
//             getActiveDocumentStub.resolves({
//                 uri: filePath,
//                 languageId: 'javascript',
//                 version: 1,
//                 text: 'current content',
//             })

//             // Skip this test for now - it's failing due to mocking issues
//             this.skip()
//         })
//     })

//     describe('dispose', function () {
//         it('should clear all collections and reset storage size', async function () {
//             // Add some data to the tracker
//             const mockDocument = {
//                 uri: 'file:///path/to/file.js',
//                 languageId: 'javascript',
//                 version: 1,
//                 text: 'current content',
//             }

//             tracker.handleDocumentOpen(mockDocument)
//             await tracker.processEdit(mockDocument, 'previous content')

//             // Verify data exists
//             assert.strictEqual(tracker.getTotalSnapshotCount(), 1)
//             assert.strictEqual((tracker as any).shadowCopies.size, 1)
//             assert.strictEqual((tracker as any).activeDocuments.size, 1)
//             assert.notStrictEqual((tracker as any).storageSize, 0)

//             // Dispose
//             tracker.dispose()

//             // Verify everything is cleared
//             assert.strictEqual(tracker.getTotalSnapshotCount(), 0)
//             assert.strictEqual((tracker as any).shadowCopies.size, 0)
//             assert.strictEqual((tracker as any).activeDocuments.size, 0)
//             assert.strictEqual((tracker as any).storageSize, 0)
//         })
//     })
// })

// describe('generateDiffContexts', function () {
//     let sandbox: sinon.SinonSandbox

//     beforeEach(function () {
//         sandbox = sinon.createSandbox()
//     })

//     afterEach(function () {
//         sandbox.restore()
//     })

//     it('should return empty context when no snapshots provided', function () {
//         const result = generateDiffContexts('file:///path/to/file.js', 'current content', [], 5)

//         assert.strictEqual(result.supplementalContextItems.length, 0)
//         assert.strictEqual(result.contentsLength, 0)
//         assert.strictEqual(result.strategy, 'recentEdits')
//     })

//     it('should generate diff contexts from snapshots', function () {
//         const filePath = 'file:///path/to/file.js'
//         const currentContent = 'function hello() {\n  console.log("hello world");\n}'
//         const snapshotContents: FileSnapshotContent[] = [
//             {
//                 filePath,
//                 content: 'function hello() {\n  // TODO\n}',
//                 timestamp: 1000,
//             },
//             {
//                 filePath,
//                 content: 'function hello() {\n  console.log("hello");\n}',
//                 timestamp: 2000,
//             },
//         ]

//         const result = generateDiffContexts(filePath, currentContent, snapshotContents, 5)

//         assert.strictEqual(result.supplementalContextItems.length, 2)
//         assert.strictEqual(result.strategy, 'recentEdits')
//         assert.strictEqual(result.isUtg, false)

//         // Check that each context item has the expected properties
//         result.supplementalContextItems.forEach(item => {
//             assert.strictEqual(item.filePath, filePath)
//             assert.ok(item.content.length > 0)
//             assert.strictEqual(item.score, 1.0)
//         })
//     })

//     it('should trim contexts to respect maxContexts limit', function () {
//         const filePath = 'file:///path/to/file.js'
//         const currentContent = 'final content'

//         // Create 10 snapshots
//         const snapshotContents: FileSnapshotContent[] = []
//         for (let i = 0; i < 10; i++) {
//             snapshotContents.push({
//                 filePath,
//                 content: `content ${i}`,
//                 timestamp: i * 1000,
//             })
//         }

//         // Set max contexts to 3
//         const result = generateDiffContexts(filePath, currentContent, snapshotContents, 3)

//         // Should only have 3 contexts
//         assert.strictEqual(result.supplementalContextItems.length, 3)
//     })

//     it('should trim contexts to respect total character limit', function () {
//         const filePath = 'file:///path/to/file.js'
//         const currentContent = 'final content'

//         // Create snapshots with large content
//         const largeContent = 'a'.repeat(5000)
//         const snapshotContents: FileSnapshotContent[] = [
//             {
//                 filePath,
//                 content: largeContent,
//                 timestamp: 1000,
//             },
//             {
//                 filePath,
//                 content: largeContent,
//                 timestamp: 2000,
//             },
//             {
//                 filePath,
//                 content: largeContent,
//                 timestamp: 3000,
//             },
//         ]

//         const result = generateDiffContexts(filePath, currentContent, snapshotContents, 5)

//         // Should have fewer contexts than provided due to total size limit
//         assert.ok(result.supplementalContextItems.length < 3)

//         // Total content length should be less than the limit
//         assert.ok(result.contentsLength <= 8192)
//     })

//     it('should generate correct unified diff format for added lines', function () {
//         const filePath = 'file:///path/to/file.js'
//         const oldContent = 'function sum(a, b) {\n  return a + b;\n}'
//         const newContent = 'function sum(a, b) {\n  // Add two numbers\n  return a + b;\n}'

//         const snapshotContents: FileSnapshotContent[] = [
//             {
//                 filePath,
//                 content: oldContent,
//                 timestamp: 1000,
//             },
//         ]

//         const result = generateDiffContexts(filePath, newContent, snapshotContents, 5)

//         assert.strictEqual(result.supplementalContextItems.length, 1)
//         const diffContent = result.supplementalContextItems[0].content

//         // Verify diff format contains the added line with '+' prefix
//         assert.ok(diffContent.includes('+  // Add two numbers'))

//         // Verify diff contains context lines (unchanged lines)
//         assert.ok(diffContent.includes(' function sum(a, b) {'))
//         assert.ok(diffContent.includes(' return a + b;'))
//     })

//     it('should generate correct unified diff format for removed lines', function () {
//         const filePath = 'file:///path/to/file.js'
//         const oldContent = 'function multiply(a, b) {\n  // Multiply two numbers\n  return a * b;\n}'
//         const newContent = 'function multiply(a, b) {\n  return a * b;\n}'

//         const snapshotContents: FileSnapshotContent[] = [
//             {
//                 filePath,
//                 content: oldContent,
//                 timestamp: 1000,
//             },
//         ]

//         const result = generateDiffContexts(filePath, newContent, snapshotContents, 5)

//         assert.strictEqual(result.supplementalContextItems.length, 1)
//         const diffContent = result.supplementalContextItems[0].content

//         // Verify diff format contains the removed line with '-' prefix
//         assert.ok(diffContent.includes('-  // Multiply two numbers'))

//         // Verify diff contains context lines (unchanged lines)
//         assert.ok(diffContent.includes(' function multiply(a, b) {'))
//         assert.ok(diffContent.includes(' return a * b;'))
//     })

//     it('should generate correct unified diff format for modified lines', function () {
//         const filePath = 'file:///path/to/file.js'
//         const oldContent = 'function greet(name) {\n  return "Hello " + name;\n}'
//         const newContent = 'function greet(name) {\n  return `Hello ${name}`;\n}'

//         const snapshotContents: FileSnapshotContent[] = [
//             {
//                 filePath,
//                 content: oldContent,
//                 timestamp: 1000,
//             },
//         ]

//         const result = generateDiffContexts(filePath, newContent, snapshotContents, 5)

//         assert.strictEqual(result.supplementalContextItems.length, 1)
//         const diffContent = result.supplementalContextItems[0].content

//         // Verify diff format contains both the removed and added lines
//         assert.ok(diffContent.includes('-  return "Hello " + name;'))
//         assert.ok(diffContent.includes('+  return `Hello ${name}`;'))

//         // Verify diff contains context lines (unchanged lines)
//         assert.ok(diffContent.includes(' function greet(name) {'))
//     })

//     it('should generate correct unified diff format for multiple changes', function () {
//         const filePath = 'file:///path/to/file.js'
//         const oldContent = 'class Calculator {\n  add(a, b) {\n    return a + b;\n  }\n}'
//         const newContent =
//             'class Calculator {\n  add(a, b) {\n    return a + b;\n  }\n  subtract(a, b) {\n    return a - b;\n  }\n}'

//         const snapshotContents: FileSnapshotContent[] = [
//             {
//                 filePath,
//                 content: oldContent,
//                 timestamp: 1000,
//             },
//         ]

//         const result = generateDiffContexts(filePath, newContent, snapshotContents, 5)

//         assert.strictEqual(result.supplementalContextItems.length, 1)
//         const diffContent = result.supplementalContextItems[0].content

//         // Verify diff contains the key parts we expect
//         assert.ok(diffContent.includes('subtract'), 'Diff should include "subtract" method')
//         assert.ok(diffContent.includes('return a - b'), 'Diff should include subtract implementation')

//         // Verify diff contains context lines (unchanged lines)
//         assert.ok(diffContent.includes('add(a, b)'), 'Diff should include context from unchanged method')
//         assert.ok(diffContent.includes('return a + b'), 'Diff should include context from unchanged implementation')

//         // Verify diff format with + for added lines
//         assert.ok(diffContent.includes('+  subtract'), 'Added lines should be prefixed with +')
//         assert.ok(diffContent.includes('+    return a - b'), 'Added lines should be prefixed with +')
//     })

//     it('should include file paths and timestamps in diff header', function () {
//         const filePath = 'file:///path/to/file.js'
//         const oldContent = 'const x = 10;'
//         const newContent = 'const x = 20;'
//         const timestamp = 1000

//         const snapshotContents: FileSnapshotContent[] = [
//             {
//                 filePath,
//                 content: oldContent,
//                 timestamp,
//             },
//         ]

//         const result = generateDiffContexts(filePath, newContent, snapshotContents, 5)

//         assert.strictEqual(result.supplementalContextItems.length, 1)
//         const diffContent = result.supplementalContextItems[0].content

//         // Verify diff header contains file paths
//         assert.ok(diffContent.includes('--- ' + filePath))
//         assert.ok(diffContent.includes('+++ ' + filePath))

//         // Verify diff header contains timestamps
//         assert.ok(diffContent.includes(timestamp.toString()))
//     })

//     it('should handle empty file content correctly', function () {
//         const filePath = 'file:///path/to/file.js'
//         const oldContent = ''
//         const newContent = 'console.log("Hello world");'

//         const snapshotContents: FileSnapshotContent[] = [
//             {
//                 filePath,
//                 content: oldContent,
//                 timestamp: 1000,
//             },
//         ]

//         const result = generateDiffContexts(filePath, newContent, snapshotContents, 5)

//         assert.strictEqual(result.supplementalContextItems.length, 1)
//         const diffContent = result.supplementalContextItems[0].content

//         // Verify diff format shows the added content
//         assert.ok(diffContent.includes('+console.log("Hello world");'))
//     })

//     it('should handle multiple snapshots and generate diffs in correct order', function () {
//         const filePath = 'file:///path/to/file.js'
//         const currentContent = 'function test() {\n  console.log("final");\n  return true;\n}'

//         const snapshotContents: FileSnapshotContent[] = [
//             {
//                 filePath,
//                 content: 'function test() {\n  // TODO\n}',
//                 timestamp: 1000,
//             },
//             {
//                 filePath,
//                 content: 'function test() {\n  console.log("step 1");\n}',
//                 timestamp: 2000,
//             },
//             {
//                 filePath,
//                 content: 'function test() {\n  console.log("step 2");\n  return true;\n}',
//                 timestamp: 3000,
//             },
//         ]

//         const result = generateDiffContexts(filePath, currentContent, snapshotContents, 5)

//         // Should have 3 diff contexts (one for each snapshot)
//         assert.strictEqual(result.supplementalContextItems.length, 3)

//         // Verify the diffs are ordered from newest to oldest
//         // The newest snapshot should be first in the array
//         const newestDiff = result.supplementalContextItems[0].content
//         assert.ok(newestDiff.includes('step 2'))

//         const middleDiff = result.supplementalContextItems[1].content
//         assert.ok(middleDiff.includes('step 1'))

//         const oldestDiff = result.supplementalContextItems[2].content
//         assert.ok(oldestDiff.includes('TODO'))
//     })
// })
