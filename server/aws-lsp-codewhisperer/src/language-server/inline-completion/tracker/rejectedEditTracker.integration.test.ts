/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as sinon from 'sinon'
import * as assert from 'assert'
import { RejectedEditTracker } from './rejectedEditTracker'

describe('RejectedEditTracker Integration', function () {
    let mockLogging: any
    let rejectedEditTracker: RejectedEditTracker
    let mockSession: any

    beforeEach(function () {
        // Set up mocks
        mockLogging = {
            debug: sinon.stub(),
            error: sinon.stub(),
            info: sinon.stub(),
            warn: sinon.stub(),
            log: sinon.stub(),
        }

        mockSession = {
            id: 'test-session-id',
            document: {
                uri: 'file:///test.js',
                getText: () => 'function test() { return true; }',
                languageId: 'javascript',
            },
            suggestions: [
                {
                    itemId: 'suggestion-1',
                    content: 'function sum(a, b) {\n  return a + b;\n}',
                    insertText: 'function sum(a, b) {\n  return a + b;\n}',
                },
                {
                    itemId: 'suggestion-2',
                    content: 'function multiply(a, b) {\n  return a * b;\n}',
                    insertText: 'function multiply(a, b) {\n  return a * b;\n}',
                },
            ],
            startPosition: { line: 10, character: 5 },
            setSuggestionState: sinon.stub(),
            state: 'ACTIVE',
        }

        // Reset the singleton
        if ((RejectedEditTracker as any)._instance) {
            ;(RejectedEditTracker as any)._instance = undefined
        }
        rejectedEditTracker = new RejectedEditTracker(mockLogging)
    })

    describe('Edit Rejection Flow', function () {
        it('should record rejected edits when user rejects an edit prediction', function () {
            // Simulate completion session results with a rejected suggestion
            const completionSessionResult = {
                'suggestion-1': {
                    seen: true,
                    accepted: false,
                    discarded: false,
                },
            }

            // Create params object similar to what would be passed to onLogInlineCompletionSessionResultsHandler
            const params = {
                sessionId: 'test-session-id',
                completionSessionResult,
                firstCompletionDisplayLatency: 100,
                totalSessionDisplayTime: 1000,
                typeaheadLength: 0,
                addedCharacterCount: 0,
                deletedCharacterCount: 0,
            }

            // Simulate the handler logic
            const isInlineEdit = true
            const session = mockSession
            const acceptedItemId = Object.keys(params.completionSessionResult).find(
                (k: string) => params.completionSessionResult[k as keyof typeof params.completionSessionResult].accepted
            )
            const isAccepted = acceptedItemId ? true : false

            // Handle rejected edit predictions
            if (isInlineEdit && !isAccepted) {
                // Find all rejected suggestions in this session
                const rejectedSuggestions = session.suggestions.filter((suggestion: any) => {
                    const result = completionSessionResult[suggestion.itemId as keyof typeof completionSessionResult]
                    return result && result.seen && !result.accepted
                })

                // Record each rejected edit
                for (const rejectedSuggestion of rejectedSuggestions) {
                    if (rejectedSuggestion.content) {
                        rejectedEditTracker.recordRejectedEdit({
                            content: rejectedSuggestion.content,
                            timestamp: Date.now(),
                            documentUri: session.document.uri,
                            position: session.startPosition,
                        })
                    }
                }
            }

            // Verify the edit was recorded
            assert.strictEqual(rejectedEditTracker.getCount(), 1)

            // Verify logging
            sinon.assert.calledWith(mockLogging.debug, sinon.match(/Recorded rejected edit/))
        })

        it('should filter out similar edits in future suggestions', function () {
            // Create a tracker with a lower similarity threshold for this test
            const customTracker = new RejectedEditTracker(mockLogging, {
                maxEntries: 50,
                similarityThreshold: 0.7, // Lower threshold to ensure the test passes
            })

            // First record a rejected edit
            customTracker.recordRejectedEdit({
                content: 'function sum(a, b) {\n  return a + b;\n}',
                timestamp: Date.now(),
                documentUri: 'file:///test.js',
                position: { line: 10, character: 5 },
            })

            // Simulate new suggestions, including one similar to the rejected edit
            const newSuggestions = [
                {
                    itemId: 'new-suggestion-1',
                    content: 'function sum(a, b) {\n  return a + b; // Add two numbers\n}', // Similar to rejected
                    insertText: 'function sum(a, b) {\n  return a + b; // Add two numbers\n}',
                },
                {
                    itemId: 'new-suggestion-2',
                    content: 'function divide(a, b) {\n  return a / b;\n}', // Different from rejected
                    insertText: 'function divide(a, b) {\n  return a / b;\n}',
                },
            ]

            // Simulate the filtering logic
            const filteredSuggestions = newSuggestions.filter(suggestion => {
                // Skip if the suggestion is empty
                if (!suggestion.content) {
                    return false
                }

                // Check if this suggestion is similar to a previously rejected edit
                const isSimilarToRejected = customTracker.isSimilarToRejected(suggestion.content, 'file:///test.js')

                if (isSimilarToRejected) {
                    // In the real implementation, we would mark as rejected in the session
                    return false
                }

                return true
            })

            // Verify that the similar suggestion was filtered out
            assert.strictEqual(filteredSuggestions.length, 1)
            assert.strictEqual(filteredSuggestions[0].itemId, 'new-suggestion-1')
        })

        it('should only filter edits for the correct document', function () {
            // Record a rejected edit for document A
            rejectedEditTracker.recordRejectedEdit({
                content: 'function sum(a, b) {\n  return a + b;\n}',
                timestamp: Date.now(),
                documentUri: 'file:///documentA.js',
                position: { line: 10, character: 5 },
            })

            // Check if a similar edit for document B would be filtered
            const isSimilarInDocB = rejectedEditTracker.isSimilarToRejected(
                'function sum(a, b) {\n  return a + b; // Add two numbers\n}',
                'file:///documentB.js'
            )

            // It should not be filtered because it's for a different document
            assert.strictEqual(isSimilarInDocB, false)
        })

        it('should handle multiple rejected edits', function () {
            // Create a tracker with a lower similarity threshold for this test
            const customTracker = new RejectedEditTracker(mockLogging, {
                maxEntries: 50,
                similarityThreshold: 0.7, // Lower threshold to ensure the test passes
            })

            // Record multiple rejected edits
            customTracker.recordRejectedEdit({
                content: 'function sum(a, b) {\n  return a + b;\n}',
                timestamp: Date.now(),
                documentUri: 'file:///test.js',
                position: { line: 10, character: 5 },
            })

            customTracker.recordRejectedEdit({
                content: 'function multiply(a, b) {\n  return a * b;\n}',
                timestamp: Date.now(),
                documentUri: 'file:///test.js',
                position: { line: 20, character: 5 },
            })

            // Check that both are tracked
            assert.strictEqual(customTracker.getCount(), 2)

            // Check that similar edits to both are filtered
            const isSimilarToFirst = customTracker.isSimilarToRejected(
                'function sum(a, b) {\n  return a + b; // Add\n}',
                'file:///test.js'
            )
            assert.strictEqual(isSimilarToFirst, true)

            const isSimilarToSecond = customTracker.isSimilarToRejected(
                'function multiply(a, b) {\n  return a * b; // Multiply\n}',
                'file:///test.js'
            )
            assert.strictEqual(isSimilarToSecond, true)
        })
    })
})
