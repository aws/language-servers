import * as assert from 'assert'
import { getModelSelectionChatItem, modelUnavailableBanner, modelThrottledBanner } from './modelSelection'
import { ChatItemType } from '@aws/mynah-ui'

/**
 * Tests for modelSelection functionality
 */
describe('modelSelection', () => {
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
