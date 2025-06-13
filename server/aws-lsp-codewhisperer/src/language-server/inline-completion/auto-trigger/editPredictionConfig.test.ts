/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert'
import { EditPredictionConfigManager, DEFAULT_EDIT_PREDICTION_CONFIG } from './editPredictionConfig'

describe('EditPredictionConfigManager', function () {
    beforeEach(function () {
        // Reset the singleton instance before each test
        // @ts-ignore - accessing private static property for testing
        EditPredictionConfigManager.instance = undefined
    })

    it('getInstance should return the same instance', function () {
        // Arrange & Act
        const instance1 = EditPredictionConfigManager.getInstance()
        const instance2 = EditPredictionConfigManager.getInstance()

        // Assert
        assert.strictEqual(instance1, instance2)
    })

    it('getConfig should return default config initially', function () {
        // Arrange
        const configManager = EditPredictionConfigManager.getInstance()

        // Act
        const config = configManager.getConfig()

        // Assert
        assert.deepStrictEqual(config, DEFAULT_EDIT_PREDICTION_CONFIG)
    })

    it('getConfig should return a copy of the config', function () {
        // Arrange
        const configManager = EditPredictionConfigManager.getInstance()

        // Act
        const config1 = configManager.getConfig()
        const config2 = configManager.getConfig()

        // Assert
        assert.notStrictEqual(config1, config2)
        assert.deepStrictEqual(config1, config2)
    })

    it('updateConfig should update the config', function () {
        // Arrange
        const configManager = EditPredictionConfigManager.getInstance()
        const updates = {
            recentEditThresholdMs: 30000,
            userPauseThresholdMs: 5000,
        }

        // Act
        configManager.updateConfig(updates)
        const config = configManager.getConfig()

        // Assert
        assert.strictEqual(config.recentEditThresholdMs, 30000)
        assert.strictEqual(config.userPauseThresholdMs, 5000)

        // Other properties should remain unchanged
        assert.strictEqual(config.recentRejectionThresholdMs, DEFAULT_EDIT_PREDICTION_CONFIG.recentRejectionThresholdMs)
    })

    it('resetToDefaults should reset the config to defaults', function () {
        // Arrange
        const configManager = EditPredictionConfigManager.getInstance()
        configManager.updateConfig({
            recentEditThresholdMs: 30000,
            userPauseThresholdMs: 5000,
        })

        // Act
        configManager.resetToDefaults()
        const config = configManager.getConfig()

        // Assert
        assert.deepStrictEqual(config, DEFAULT_EDIT_PREDICTION_CONFIG)
    })

    it('updateConfig should not affect other instances', function () {
        // Arrange
        const configManager1 = EditPredictionConfigManager.getInstance()

        // Act
        configManager1.updateConfig({
            recentEditThresholdMs: 30000,
        })

        // Get a "new" instance (which should be the same singleton)
        const configManager2 = EditPredictionConfigManager.getInstance()
        const config = configManager2.getConfig()

        // Assert
        assert.strictEqual(config.recentEditThresholdMs, 30000)
    })
})
