/**
 * **Feature: mynah-ui-port, Property 3: Test File Completeness**
 * **Validates: Requirements 5.1**
 *
 * Property: For any test file that exists in the original `mynah-ui/src/__test__/`
 * or component test directories, a corresponding test file SHALL exist in the
 * ported package's test directories.
 *
 * This test uses property-based testing to verify that all test files from the
 * original mynah-ui repository have been successfully ported to the language-servers
 * monorepo.
 */

import * as fc from 'fast-check'
import * as fs from 'fs'
import * as path from 'path'

// Test files that exist in the original mynah-ui repository
// These are the test files that should be present in the ported package
// Note: Some test files may have been intentionally excluded or consolidated
const ORIGINAL_TEST_FILES = [
    // Main test
    'src/__test__/main.spec.ts',

    // Helper tests
    'src/helper/__test__/date-time.spec.ts',
    'src/helper/__test__/dom.spec.ts',
    'src/helper/__test__/events.spec.ts',
    'src/helper/__test__/file-tree.spec.ts',
    'src/helper/__test__/guid.spec.ts',
    'src/helper/__test__/security.spec.ts',
    'src/helper/__test__/style-loader.spec.ts',

    // Component tests - root level
    'src/components/__test__/button.spec.ts',
    'src/components/__test__/icon.spec.ts',
    'src/components/__test__/notification.spec.ts',
    'src/components/__test__/syntax-highlighter.spec.ts',
    'src/components/__test__/toggle.spec.ts',

    // Component tests - chat-item
    'src/components/__test__/chat-item/chat-item-buttons.spec.ts',
    'src/components/__test__/chat-item/chat-item-card-content.spec.ts',
    'src/components/__test__/chat-item/chat-item-card.spec.ts',
    'src/components/__test__/chat-item/chat-item-followup.spec.ts',
    'src/components/__test__/chat-item/chat-item-form-items.spec.ts',
    'src/components/__test__/chat-item/chat-item-information-card.spec.ts',
    'src/components/__test__/chat-item/chat-item-relevance-vote.spec.ts',
    'src/components/__test__/chat-item/chat-item-source-links.spec.ts',
    'src/components/__test__/chat-item/chat-item-tabbed-card.spec.ts',
    'src/components/__test__/chat-item/chat-item-tree-file.spec.ts',
    'src/components/__test__/chat-item/chat-item-tree-view-license.spec.ts',
    'src/components/__test__/chat-item/chat-item-tree-view-wrapper.spec.ts',
    'src/components/__test__/chat-item/chat-item-tree-view.spec.ts',
    'src/components/__test__/chat-item/chat-prompt-input-command.spec.ts',
    'src/components/__test__/chat-item/chat-prompt-input-info.spec.ts',
    'src/components/__test__/chat-item/chat-prompt-input-sticky-card.spec.ts',
    'src/components/__test__/chat-item/chat-prompt-input.spec.ts',
    'src/components/__test__/chat-item/chat-wrapper.spec.ts',
    'src/components/__test__/chat-item/prompt-attachment.spec.ts',
    'src/components/__test__/chat-item/prompt-input-send-button.spec.ts',
    'src/components/__test__/chat-item/prompt-input-stop-button.spec.ts',
    'src/components/__test__/chat-item/prompt-options.spec.ts',
    'src/components/__test__/chat-item/prompt-progress.spec.ts',
    'src/components/__test__/chat-item/prompt-text-attachment.spec.ts',
    'src/components/__test__/chat-item/prompt-text-input.spec.ts',
    'src/components/__test__/chat-item/prompt-top-bar-button.spec.ts',
    'src/components/__test__/chat-item/prompt-top-bar.spec.ts',

    // Component tests - feedback-form
    'src/components/__test__/feedback-form/feedback-form.spec.ts',

    // Additional test files from src/__test__/components/ directory
    'src/__test__/components/chat-item/chat-item-relevance-vote.spec.ts',
    'src/__test__/components/chat-item/chat-item-relevance-vote-coverage.spec.ts',
    'src/__test__/components/chat-item/prompt-input/prompt-top-bar/prompt-top-bar.spec.ts',
    'src/__test__/components/chat-item/prompt-input/prompt-top-bar/prompt-top-bar-edge-cases.spec.ts',
    'src/__test__/components/chat-item/prompt-input/prompt-top-bar/prompt-top-bar-overflow.spec.ts',
    'src/__test__/components/chat-item/prompt-input/prompt-top-bar/prompt-top-bar-overflow-detailed.spec.ts',
    'src/__test__/components/chat-item/prompt-input/prompt-top-bar/top-bar-button.spec.ts',
    'src/__test__/components/chat-item/prompt-input/prompt-top-bar/top-bar-button-overlay.spec.ts',

    // Detailed list tests
    'src/__test__/components/detailed-list/detailed-list.spec.ts',
    'src/__test__/components/detailed-list/detailed-list-item.spec.ts',
    'src/__test__/components/detailed-list/detailed-list-sheet.spec.ts',

    // Feedback form tests
    'src/__test__/components/feedback-form/feedback-form.spec.ts',
    'src/__test__/components/feedback-form/feedback-form-comment.spec.ts',
    'src/__test__/components/feedback-form/feedback-form-coverage-simple.spec.ts',
    'src/__test__/components/feedback-form/feedback-form-integration.spec.ts',
    'src/__test__/components/feedback-form/index.spec.ts',

    // Form items tests
    'src/__test__/components/form-items/checkbox.spec.ts',
    'src/__test__/components/form-items/form-item-list.spec.ts',
    'src/__test__/components/form-items/form-item-pill-box.spec.ts',
    'src/__test__/components/form-items/radio-group.spec.ts',
    'src/__test__/components/form-items/select.spec.ts',
    'src/__test__/components/form-items/stars.spec.ts',
    'src/__test__/components/form-items/switch.spec.ts',
    'src/__test__/components/form-items/text-area.spec.ts',
    'src/__test__/components/form-items/text-input.spec.ts',

    // Source link tests
    'src/__test__/components/source-link/source-link.spec.ts',
    'src/__test__/components/source-link/source-link-body.spec.ts',
    'src/__test__/components/source-link/source-link-header.spec.ts',
] as const

// Get the mynah-ui package root directory
const MYNAH_UI_ROOT = path.resolve(__dirname, '../..')

describe('Test File Completeness Property Test', () => {
    /**
     * Property 3: Test File Completeness
     *
     * For any test file from the original mynah-ui repository,
     * the ported package SHALL contain a corresponding test file.
     */
    it('should have all original test files present in the ported package', () => {
        fc.assert(
            fc.property(fc.constantFrom(...ORIGINAL_TEST_FILES), testFilePath => {
                const fullPath = path.join(MYNAH_UI_ROOT, testFilePath)
                const fileExists = fs.existsSync(fullPath)

                if (!fileExists) {
                    throw new Error(
                        `Missing test file: '${testFilePath}' is not present in the ported package at ${fullPath}`
                    )
                }

                return fileExists
            }),
            { numRuns: ORIGINAL_TEST_FILES.length }
        )
    })

    /**
     * Verify that test files are readable and not empty
     */
    it('should have all test files readable and non-empty', () => {
        fc.assert(
            fc.property(fc.constantFrom(...ORIGINAL_TEST_FILES), testFilePath => {
                const fullPath = path.join(MYNAH_UI_ROOT, testFilePath)

                // Skip if file doesn't exist (covered by previous test)
                if (!fs.existsSync(fullPath)) {
                    return true
                }

                const content = fs.readFileSync(fullPath, 'utf-8')
                const isNonEmpty = content.trim().length > 0

                if (!isNonEmpty) {
                    throw new Error(`Test file '${testFilePath}' exists but is empty`)
                }

                return isNonEmpty
            }),
            { numRuns: ORIGINAL_TEST_FILES.length }
        )
    })

    /**
     * Verify that test files contain valid test structure
     * (at least one describe or it block, or is a barrel/index file with exports)
     */
    it('should have all test files contain valid test structure', () => {
        fc.assert(
            fc.property(fc.constantFrom(...ORIGINAL_TEST_FILES), testFilePath => {
                const fullPath = path.join(MYNAH_UI_ROOT, testFilePath)

                // Skip if file doesn't exist (covered by previous test)
                if (!fs.existsSync(fullPath)) {
                    return true
                }

                const content = fs.readFileSync(fullPath, 'utf-8')
                const hasDescribe = content.includes('describe(')
                const hasIt = content.includes('it(')
                const hasTest = content.includes('test(')
                // Barrel/index files that re-export other tests are valid
                const isBarrelFile = testFilePath.endsWith('index.spec.ts') && content.includes('export *')
                const hasValidStructure = hasDescribe || hasIt || hasTest || isBarrelFile

                if (!hasValidStructure) {
                    throw new Error(
                        `Test file '${testFilePath}' does not contain valid test structure (no describe, it, or test blocks found)`
                    )
                }

                return hasValidStructure
            }),
            { numRuns: ORIGINAL_TEST_FILES.length }
        )
    })

    /**
     * Summary test: Count and report test file statistics
     */
    it('should report test file completeness statistics', () => {
        const existingFiles: string[] = []
        const missingFiles: string[] = []

        for (const testFilePath of ORIGINAL_TEST_FILES) {
            const fullPath = path.join(MYNAH_UI_ROOT, testFilePath)
            if (fs.existsSync(fullPath)) {
                existingFiles.push(testFilePath)
            } else {
                missingFiles.push(testFilePath)
            }
        }

        console.log(`\nTest File Completeness Report:`)
        console.log(`  Total expected test files: ${ORIGINAL_TEST_FILES.length}`)
        console.log(`  Files present: ${existingFiles.length}`)
        console.log(`  Files missing: ${missingFiles.length}`)

        if (missingFiles.length > 0) {
            console.log(`\nMissing test files:`)
            missingFiles.forEach(f => console.log(`  - ${f}`))
        }

        // This test passes but reports statistics
        // The actual completeness check is done by the property test above
        expect(existingFiles.length).toBeGreaterThan(0)
    })
})
