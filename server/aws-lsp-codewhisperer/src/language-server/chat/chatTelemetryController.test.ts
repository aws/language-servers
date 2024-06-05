import { TestFeatures } from '@aws/language-server-runtimes/testing'
import sinon from 'ts-sinon'
import { ChatTelemetryEventName } from '../telemetry/types'
import { CONVERSATION_ID_METRIC_KEY, ChatTelemetryController, ChatUIEventName } from './chatTelemetryController'
import assert = require('assert')

describe('TelemetryController', () => {
    const mockTabId = 'mockTabId'
    const mockConversationId = 'mockConversationId'

    let testFeatures: TestFeatures
    let telemetryController: ChatTelemetryController

    beforeEach(() => {
        testFeatures = new TestFeatures()
        telemetryController = new ChatTelemetryController(testFeatures.telemetry)
    })

    it('able to set and get activeTabId', () => {
        assert.strictEqual(telemetryController.activeTabId, undefined)

        telemetryController.activeTabId = mockTabId

        assert.strictEqual(telemetryController.activeTabId, mockTabId)
    })

    it('able to set and get conversationId for a tab id', () => {
        assert.strictEqual(telemetryController.getConversationId(mockTabId), undefined)

        telemetryController.setConversationId(mockTabId, mockConversationId)

        assert.strictEqual(telemetryController.getConversationId(mockTabId), mockConversationId)
    })

    it('able to remove conversation id by tab id from the map', () => {
        telemetryController.setConversationId(mockTabId, mockConversationId)

        assert.strictEqual(telemetryController.getConversationId(mockTabId), mockConversationId)

        telemetryController.removeConversationId(mockTabId)

        assert.strictEqual(telemetryController.getConversationId(mockTabId), undefined)
    })

    it('handles enter focus client telemetry', () => {
        const telemetryHandler = testFeatures.telemetry.onClientTelemetry.firstCall.firstArg

        telemetryHandler({
            name: ChatUIEventName.EnterUIFocus,
        })

        sinon.assert.calledOnceWithExactly(testFeatures.telemetry.emitMetric, {
            name: ChatTelemetryEventName.EnterFocusChat,
            data: {},
        })
    })

    it('handles exit focus client telemetry', () => {
        const telemetryHandler = testFeatures.telemetry.onClientTelemetry.firstCall.firstArg

        telemetryHandler({
            name: ChatUIEventName.ExitUIFocus,
        })

        sinon.assert.calledOnceWithExactly(testFeatures.telemetry.emitMetric, {
            name: ChatTelemetryEventName.ExitFocusChat,
            data: {},
        })
    })

    it('does not handle unknown client telemetry', () => {
        const telemetryHandler = testFeatures.telemetry.onClientTelemetry.firstCall.firstArg

        telemetryHandler({
            params: { name: 'Unknown event' },
        })

        sinon.assert.notCalled(testFeatures.telemetry.emitMetric)
    })

    it('does not emit metrics if conversation id is not present', () => {
        telemetryController.emitConversationMetric({
            name: ChatTelemetryEventName.EnterFocusConversation,
            data: {},
        })

        sinon.assert.notCalled(testFeatures.telemetry.emitMetric)
    })

    it('emits metrics only if conversation id for active tab is present', () => {
        telemetryController.setConversationId(mockTabId, mockConversationId)
        telemetryController.activeTabId = mockTabId

        telemetryController.emitConversationMetric({
            name: ChatTelemetryEventName.EnterFocusConversation,
            data: {},
        })

        sinon.assert.calledOnceWithExactly(testFeatures.telemetry.emitMetric, {
            name: ChatTelemetryEventName.EnterFocusConversation,
            data: {
                [CONVERSATION_ID_METRIC_KEY]: mockConversationId,
            },
        })
    })
})
