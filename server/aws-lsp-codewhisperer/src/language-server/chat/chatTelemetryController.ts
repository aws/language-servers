import { MetricEvent } from '@aws/language-server-runtimes/server-interface'

import { ChatTelemetryEventMap, ChatTelemetryEventName } from '../telemetry/types'
import { Features } from '../types'
import { isObject } from '../utils'

export const CONVERSATION_ID_METRIC_KEY = 'CWSPRChatConversationId'

export enum ChatUIEventName {
    EnterFocus = 'enterFocus',
    ExitFocus = 'exitFocus',
}

interface ChatMetricEvent<TName extends ChatTelemetryEventName> extends MetricEvent {
    name: TName
    data: ChatTelemetryEventMap[TName]
}

export class ChatTelemetryController {
    #activeTabId?: string
    #conversationIdByTabId: { [tabId: string]: string }
    #telemetry: Features['telemetry']

    constructor(telemetry: Features['telemetry']) {
        this.#conversationIdByTabId = {}
        this.#telemetry = telemetry

        this.#telemetry.onClientTelemetry(params => this.#handleClientTelemetry(params))
    }

    public set activeTabId(tabId: string | undefined) {
        this.#activeTabId = tabId
    }

    public get activeTabId(): string | undefined {
        return this.#activeTabId
    }

    public getConversationId(tabId?: string) {
        return tabId && this.#conversationIdByTabId[tabId]
    }

    public removeConversationId(tabId: string) {
        delete this.#conversationIdByTabId[tabId]
    }

    public setConversationId(tabId: string, conversationId: string) {
        this.#conversationIdByTabId[tabId] = conversationId
    }

    public emitChatMetric<TName extends ChatTelemetryEventName>(metric: ChatMetricEvent<TName>) {
        this.#telemetry.emitMetric(metric)
    }

    public emitConversationMetric<TName extends ChatTelemetryEventName>(
        metric: Omit<ChatMetricEvent<TName>, 'data'> & {
            data: Omit<ChatMetricEvent<TName>['data'], typeof CONVERSATION_ID_METRIC_KEY>
        }
    ) {
        const conversationId = this.getConversationId(this.activeTabId)
        if (conversationId) {
            this.emitChatMetric({
                ...metric,
                data: {
                    ...metric.data,
                    [CONVERSATION_ID_METRIC_KEY]: conversationId,
                },
            })
        }
    }

    #handleClientTelemetry(params: unknown) {
        if (isObject(params) && 'name' in params && typeof params.name === 'string') {
            switch (params.name) {
                case ChatUIEventName.EnterFocus:
                    this.emitChatMetric({
                        name: ChatTelemetryEventName.EnterFocusChat,
                        data: {},
                    })
                    break
                case ChatUIEventName.ExitFocus:
                    this.emitChatMetric({
                        name: ChatTelemetryEventName.ExitFocusChat,
                        data: {},
                    })
                    break
            }
        }
    }
}
