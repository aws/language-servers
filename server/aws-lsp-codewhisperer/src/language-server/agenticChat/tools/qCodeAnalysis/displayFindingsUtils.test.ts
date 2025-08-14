/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { DisplayFindingsUtils } from './displayFindingsUtils'
import { SuccessMetricName, FailedMetricName, DisplayFindingsMetric } from './displayFindingsTypes'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import * as sinon from 'sinon'
import { expect } from 'chai'

describe('DisplayFindingsUtils', () => {
    let sandbox: sinon.SinonSandbox

    const mockLogging = {
        log: sinon.stub(),
        info: sinon.stub(),
        warn: sinon.stub(),
        error: sinon.stub(),
        debug: sinon.stub(),
    }

    beforeEach(() => {
        sandbox = sinon.createSandbox()
        mockLogging.info.reset()
        mockLogging.warn.reset()
        mockLogging.error.reset()
        mockLogging.debug.reset()
    })

    afterEach(() => {
        sandbox.restore()
    })

    describe('emitMetric', () => {
        let mockTelemetry: Features['telemetry']

        beforeEach(() => {
            mockTelemetry = {
                emitMetric: sinon.stub(),
            } as unknown as Features['telemetry']
        })

        it('should emit a success metric with metadata', () => {
            const metric = {
                reason: SuccessMetricName.DisplayFindingsSuccess,
                result: 'Succeeded',
                metadata: { findingsCount: 5 },
            } as DisplayFindingsMetric

            DisplayFindingsUtils.emitMetric(metric, mockLogging, mockTelemetry)

            sinon.assert.calledWith(mockTelemetry.emitMetric as sinon.SinonStub, {
                name: 'amazonq_displayFindingsTool',
                data: {
                    findingsCount: 5,
                    reason: 'displayFindingsSuccess',
                    result: 'Succeeded',
                },
            })

            sinon.assert.calledWith(mockLogging.info, sinon.match(/Emitting telemetry metric: displayFindingsSuccess/))
        })

        it('should emit a failure metric with reasonDesc', () => {
            const metric = {
                reason: FailedMetricName.DisplayFindingsFailed,
                result: 'Failed',
                reasonDesc: 'Validation failed',
                metadata: { errorType: 'validation' },
            } as DisplayFindingsMetric

            DisplayFindingsUtils.emitMetric(metric, mockLogging, mockTelemetry)

            sinon.assert.calledWith(mockTelemetry.emitMetric as sinon.SinonStub, {
                name: 'amazonq_displayFindingsTool',
                data: {
                    errorType: 'validation',
                    reason: 'displayFindingsFailed',
                    result: 'Failed',
                    reasonDesc: 'Validation failed',
                },
            })
        })

        it('should handle metrics without metadata', () => {
            const metric = {
                reason: SuccessMetricName.DisplayFindingsSuccess,
                result: 'Succeeded',
            } as DisplayFindingsMetric

            DisplayFindingsUtils.emitMetric(metric, mockLogging, mockTelemetry)

            sinon.assert.calledWith(mockTelemetry.emitMetric as sinon.SinonStub, {
                name: 'amazonq_displayFindingsTool',
                data: {
                    reason: 'displayFindingsSuccess',
                    result: 'Succeeded',
                },
            })
        })
    })
})
