import * as assert from 'assert'
import { MODEL_OPTIONS, MODEL_OPTIONS_FOR_REGION } from './modelSelection'

describe('modelSelection', () => {
    describe('modelOptions', () => {
        it('should contain the correct model options', () => {
            assert.ok(Array.isArray(MODEL_OPTIONS), 'modelOptions should be an array')
            assert.strictEqual(MODEL_OPTIONS.length, 2, 'modelOptions should have 2 items')

            // Check that the array contains the expected models
            const modelIds = MODEL_OPTIONS.map(model => model.id)
            assert.ok(modelIds.includes('CLAUDE_SONNET_4_20250514_V1_0'), 'Should include Claude Sonnet 4')
            assert.ok(modelIds.includes('CLAUDE_3_7_SONNET_20250219_V1_0'), 'Should include Claude Sonnet 3.7')

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

            assert.strictEqual(claudeSonnet4?.name, 'Claude Sonnet 4', 'Claude Sonnet 4 should have correct name')
            assert.strictEqual(claudeSonnet37?.name, 'Claude Sonnet 3.7', 'Claude Sonnet 3.7 should have correct name')
        })
    })

    describe('modelOptionsForRegion', () => {
        it('should provide all models for us-east-1 region', () => {
            const usEast1Models = MODEL_OPTIONS_FOR_REGION['us-east-1']
            assert.deepStrictEqual(usEast1Models, MODEL_OPTIONS, 'us-east-1 should have all models')
            assert.strictEqual(usEast1Models.length, 2, 'us-east-1 should have 2 models')

            const modelIds = usEast1Models.map(model => model.id)
            assert.ok(modelIds.includes('CLAUDE_SONNET_4_20250514_V1_0'), 'us-east-1 should include Claude Sonnet 4')
            assert.ok(
                modelIds.includes('CLAUDE_3_7_SONNET_20250219_V1_0'),
                'us-east-1 should include Claude Sonnet 3.7'
            )
        })

        it('should provide all models for eu-central-1 region', () => {
            const euCentral1Models = MODEL_OPTIONS_FOR_REGION['eu-central-1']
            assert.deepStrictEqual(euCentral1Models, MODEL_OPTIONS, 'us-east-1 should have all models')
            assert.strictEqual(euCentral1Models.length, 2, 'us-east-1 should have 2 models')

            const modelIds = euCentral1Models.map(model => model.id)
            assert.ok(modelIds.includes('CLAUDE_SONNET_4_20250514_V1_0'), 'eu-central-1 should include Claude Sonnet 4')
            assert.ok(
                modelIds.includes('CLAUDE_3_7_SONNET_20250219_V1_0'),
                'eu-central-1 should include Claude Sonnet 3.7'
            )
        })

        it('should fall back to all models for unknown regions', () => {
            // Test with a region that doesn't exist in the modelOptionsForRegion map
            const unknownRegionModels = MODEL_OPTIONS_FOR_REGION['unknown-region']

            // Should be undefined since the region doesn't exist in the map
            assert.strictEqual(unknownRegionModels, undefined, 'Unknown region should return undefined')
        })
    })
})
