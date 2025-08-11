import * as assert from 'assert'
import {
    BedrockModel,
    modelSelectionForRegion,
    getModelSelectionChatItem,
    modelUnavailableBanner,
    modelThrottledBanner,
} from './modelSelection'
import { ChatItemType } from '@aws/mynah-ui'

/**
 * Tests for modelSelection functionality
 *
 * Note: Some tests are for deprecated code (marked with 'legacy') that is maintained
 * for backward compatibility with older clients. These should be removed once
 * all clients have been updated to use the new API (aws/chat/listAvailableModels).
 */
describe('modelSelection', () => {
    describe('BedrockModel enum (legacy)', () => {
        it('should have the correct model IDs', () => {
            assert.strictEqual(BedrockModel.CLAUDE_3_7_SONNET_20250219_V1_0, 'CLAUDE_3_7_SONNET_20250219_V1_0')
            assert.strictEqual(BedrockModel.CLAUDE_SONNET_4_20250514_V1_0, 'CLAUDE_SONNET_4_20250514_V1_0')
        })
    })

    describe('modelSelectionForRegion (legacy)', () => {
        it('should provide all models for us-east-1 region', () => {
            const usEast1ModelSelection = modelSelectionForRegion['us-east-1']
            assert.ok(usEast1ModelSelection, 'usEast1ModelSelection should exist')
            assert.ok(usEast1ModelSelection.type === 'select', 'usEast1ModelSelection should be type select')
            assert.ok(Array.isArray(usEast1ModelSelection.options), 'options should be an array')
            assert.strictEqual(usEast1ModelSelection.options.length, 2, 'should have 2 options')

            const modelIds = usEast1ModelSelection.options.map(option => option.value)
            assert.ok(modelIds.includes(BedrockModel.CLAUDE_SONNET_4_20250514_V1_0), 'should include Claude Sonnet 4')
            assert.ok(
                modelIds.includes(BedrockModel.CLAUDE_3_7_SONNET_20250219_V1_0),
                'should include Claude Sonnet 3.7'
            )
        })

        it('should provide all models for eu-central-1 region', () => {
            const euCentral1ModelSelection = modelSelectionForRegion['eu-central-1']
            assert.ok(euCentral1ModelSelection, 'euCentral1ModelSelection should exist')
            assert.ok(euCentral1ModelSelection.type === 'select', 'euCentral1ModelSelection should be type select')
            assert.ok(Array.isArray(euCentral1ModelSelection.options), 'options should be an array')
            assert.strictEqual(euCentral1ModelSelection.options.length, 2, 'should have 2 option')

            const modelIds = euCentral1ModelSelection.options.map(option => option.value)
            assert.ok(modelIds.includes(BedrockModel.CLAUDE_SONNET_4_20250514_V1_0), 'should include Claude Sonnet 4')
            assert.ok(
                modelIds.includes(BedrockModel.CLAUDE_3_7_SONNET_20250219_V1_0),
                'should include Claude Sonnet 3.7'
            )
        })
    })

    describe('getModelSelectionChatItem', () => {
        it('should return a chat item with the correct model name', () => {
            const modelName = 'Claude Sonnet 4'
            const chatItem = getModelSelectionChatItem(modelName)

            assert.strictEqual(chatItem.type, ChatItemType.DIRECTIVE)
            assert.strictEqual(chatItem.contentHorizontalAlignment, 'center')
            assert.strictEqual(chatItem.fullWidth, true)
            assert.strictEqual(chatItem.body, `Switched model to ${modelName}`)
        })
    })

    describe('modelUnavailableBanner', () => {
        it('should have the correct properties', () => {
            assert.strictEqual(modelUnavailableBanner.messageId, 'model-unavailable-banner')
            assert.ok(modelUnavailableBanner.header, 'header should exist')
            assert.strictEqual(modelUnavailableBanner.header?.icon, 'warning')
            assert.strictEqual(modelUnavailableBanner.header?.iconStatus, 'warning')
            assert.strictEqual(modelUnavailableBanner.header?.body, '### Model Unavailable')
            assert.ok(modelUnavailableBanner.body?.includes("The model you've selected is experiencing high load"))
            assert.strictEqual(modelUnavailableBanner.canBeDismissed, true)
        })
    })

    describe('modelThrottledBanner', () => {
        it('should have the correct properties', () => {
            assert.strictEqual(modelThrottledBanner.messageId, 'model-throttled-banner')
            assert.ok(modelThrottledBanner.header, 'header should exist')
            assert.strictEqual(modelThrottledBanner.header?.icon, 'warning')
            assert.strictEqual(modelThrottledBanner.header?.iconStatus, 'warning')
            assert.strictEqual(modelThrottledBanner.header?.body, '### Model Unavailable')
            assert.ok(modelThrottledBanner.body?.includes('I am experiencing high traffic'))
            assert.strictEqual(modelThrottledBanner.canBeDismissed, true)
        })
    })
})
