import * as assert from 'assert'
import { MODEL_OPTIONS } from './modelSelection'

describe('modelSelection', () => {
    describe('modelOptions', () => {
        it('should contain the correct model options', () => {
            assert.ok(Array.isArray(MODEL_OPTIONS), 'modelOptions should be an array')
            assert.strictEqual(MODEL_OPTIONS.length, 2, 'modelOptions should have 2 items')

            // Check that the array contains the expected models
            const modelIds = MODEL_OPTIONS.map(model => model.id)
            assert.ok(modelIds.includes('CLAUDE_SONNET_4_20250514_V1_0'), 'Should include claude-4-sonnet')
            assert.ok(modelIds.includes('CLAUDE_3_7_SONNET_20250219_V1_0'), 'Should include claude-3.7-sonnet')

            // Check that each model has the required properties
            MODEL_OPTIONS.forEach(model => {
                assert.ok('id' in model, 'Model should have id property')
                assert.ok('name' in model, 'Model should have name property')
                assert.strictEqual(typeof model.id, 'string', 'Model id should be a string')
                assert.strictEqual(typeof model.name, 'string', 'Model name should be a string')
            })

            // Check specific model names
            const claudeSonnet4 = MODEL_OPTIONS.find(model => model.id === 'CLAUDE_SONNET_4_20250514_V1_0')
            const claudeSonnet37 = MODEL_OPTIONS.find(model => model.id === 'CLAUDE_3_7_SONNET_20250219_V1_0')

            assert.strictEqual(claudeSonnet4?.name, 'claude-4-sonnet', 'claude-4-sonnet should have correct name')
            assert.strictEqual(claudeSonnet37?.name, 'claude-3.7-sonnet', 'claude-3.7-sonnet should have correct name')
        })
    })
})
