/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert'
import {
    TokenLimitsCalculator,
    TOKENS_TO_CHARACTERS_RATIO,
    INPUT_LIMIT_RESERVED_CHARACTERS,
    COMPACTION_THRESHOLD_RATIO,
    DEFAULT_MAX_INPUT_TOKENS,
} from './tokenLimitsCalculator'
import { FALLBACK_MODEL_OPTIONS } from '../constants/modelSelection'

describe('TokenLimitsCalculator', () => {
    describe('calculate()', () => {
        /**
         * **Feature: dynamic-token-limits, Property 1: Character calculation consistency**
         * **Validates: Requirements 1.2**
         */
        it('should calculate maxOverallCharacters as Math.floor(maxInputTokens * 3.5)', () => {
            const testCases = [1, 100, 1000, 200_000, 500_000, 1_000_000]

            for (const maxInputTokens of testCases) {
                const result = TokenLimitsCalculator.calculate(maxInputTokens)
                const expected = Math.floor(maxInputTokens * TOKENS_TO_CHARACTERS_RATIO)

                assert.strictEqual(
                    result.maxOverallCharacters,
                    expected,
                    `For maxInputTokens=${maxInputTokens}, expected maxOverallCharacters=${expected} but got ${result.maxOverallCharacters}`
                )
            }
        })

        /**
         * **Feature: dynamic-token-limits, Property 2: Input limit calculation consistency**
         * **Validates: Requirements 1.3, 1.4**
         */
        it('should calculate inputLimit as maxOverallCharacters - 100K and compactionThreshold as 0.7 * maxOverallCharacters', () => {
            const testCases = [200_000, 500_000, 1_000_000]

            for (const maxInputTokens of testCases) {
                const result = TokenLimitsCalculator.calculate(maxInputTokens)
                const expectedInputLimit = result.maxOverallCharacters - INPUT_LIMIT_RESERVED_CHARACTERS
                const expectedCompactionThreshold = Math.floor(COMPACTION_THRESHOLD_RATIO * result.maxOverallCharacters)

                assert.strictEqual(
                    result.inputLimit,
                    expectedInputLimit,
                    `For maxInputTokens=${maxInputTokens}, expected inputLimit=${expectedInputLimit} but got ${result.inputLimit}`
                )

                assert.strictEqual(
                    result.compactionThreshold,
                    expectedCompactionThreshold,
                    `For maxInputTokens=${maxInputTokens}, expected compactionThreshold=${expectedCompactionThreshold} but got ${result.compactionThreshold}`
                )
            }
        })

        it('should use DEFAULT_MAX_INPUT_TOKENS when no argument is provided', () => {
            const result = TokenLimitsCalculator.calculate()

            assert.strictEqual(result.maxInputTokens, DEFAULT_MAX_INPUT_TOKENS)
            assert.strictEqual(
                result.maxOverallCharacters,
                Math.floor(DEFAULT_MAX_INPUT_TOKENS * TOKENS_TO_CHARACTERS_RATIO)
            )
        })

        it('should return correct default values for 200K tokens', () => {
            const result = TokenLimitsCalculator.calculate(200_000)
            const expectedMaxOverallCharacters = Math.floor(200_000 * TOKENS_TO_CHARACTERS_RATIO)
            const expectedInputLimit = expectedMaxOverallCharacters - INPUT_LIMIT_RESERVED_CHARACTERS
            const expectedCompactionThreshold = Math.floor(COMPACTION_THRESHOLD_RATIO * expectedMaxOverallCharacters)

            assert.strictEqual(result.maxInputTokens, 200_000)
            assert.strictEqual(result.maxOverallCharacters, expectedMaxOverallCharacters)
            assert.strictEqual(result.inputLimit, expectedInputLimit)
            assert.strictEqual(result.compactionThreshold, expectedCompactionThreshold)
        })
    })

    describe('extractMaxInputTokens()', () => {
        /**
         * **Feature: dynamic-token-limits, Property 3: Default fallback consistency**
         * **Validates: Requirements 2.1, 2.3**
         */
        it('should return DEFAULT_MAX_INPUT_TOKENS for undefined model', () => {
            const result = TokenLimitsCalculator.extractMaxInputTokens(undefined)
            assert.strictEqual(result, DEFAULT_MAX_INPUT_TOKENS)
        })

        it('should return DEFAULT_MAX_INPUT_TOKENS for model without tokenLimits', () => {
            const result = TokenLimitsCalculator.extractMaxInputTokens({})
            assert.strictEqual(result, DEFAULT_MAX_INPUT_TOKENS)
        })

        it('should return DEFAULT_MAX_INPUT_TOKENS for model with undefined tokenLimits', () => {
            const result = TokenLimitsCalculator.extractMaxInputTokens({ tokenLimits: undefined })
            assert.strictEqual(result, DEFAULT_MAX_INPUT_TOKENS)
        })

        it('should return DEFAULT_MAX_INPUT_TOKENS for model with tokenLimits but undefined maxInputTokens', () => {
            const result = TokenLimitsCalculator.extractMaxInputTokens({ tokenLimits: {} })
            assert.strictEqual(result, DEFAULT_MAX_INPUT_TOKENS)
        })

        it('should return DEFAULT_MAX_INPUT_TOKENS for model with tokenLimits but null maxInputTokens', () => {
            const result = TokenLimitsCalculator.extractMaxInputTokens({
                tokenLimits: { maxInputTokens: null as unknown as undefined },
            })
            assert.strictEqual(result, DEFAULT_MAX_INPUT_TOKENS)
        })

        it('should return the actual maxInputTokens when provided', () => {
            const result = TokenLimitsCalculator.extractMaxInputTokens({
                tokenLimits: { maxInputTokens: 500_000 },
            })
            assert.strictEqual(result, 500_000)
        })
    })

    describe('FALLBACK_MODEL_OPTIONS', () => {
        /**
         * Verify FALLBACK_MODEL_OPTIONS includes tokenLimits.maxInputTokens of 200,000
         * **Validates: Requirements 2.4**
         */
        it('should include tokenLimits.maxInputTokens of 200,000 for all fallback models', () => {
            assert.ok(FALLBACK_MODEL_OPTIONS.length > 0, 'FALLBACK_MODEL_OPTIONS should contain at least one model')

            for (const model of FALLBACK_MODEL_OPTIONS) {
                const modelWithTokenLimits = model as typeof model & {
                    tokenLimits?: { maxInputTokens?: number }
                }
                assert.ok(
                    modelWithTokenLimits.tokenLimits !== undefined,
                    `Model ${model.id} should have tokenLimits defined`
                )
                assert.strictEqual(
                    modelWithTokenLimits.tokenLimits?.maxInputTokens,
                    DEFAULT_MAX_INPUT_TOKENS,
                    `Model ${model.id} should have tokenLimits.maxInputTokens of ${DEFAULT_MAX_INPUT_TOKENS}`
                )
            }
        })
    })
})
