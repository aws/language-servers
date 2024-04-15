/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

export const UI_IS_READY = 'ui-is-ready'
export const UI_FOCUS = 'ui-focus'

export type MessageCommand =
    | 'chat-prompt'
    | 'trigger-message-processed'
    | 'new-tab-was-created'
    | 'tab-was-removed'
    | 'tab-was-changed'
    | typeof UI_IS_READY
    | typeof UI_FOCUS
    | 'follow-up-was-clicked'
    | 'auth-follow-up-was-clicked'
    | 'open-diff'
    | 'code_was_copied_to_clipboard'
    | 'insert_code_at_cursor_position'
    | 'stop-response'
    | 'trigger-tabID-received'
    | 'clear'
    | 'help'
    | 'chat-item-voted'
    | 'chat-item-feedback'
    | 'link-was-clicked'
    | 'onboarding-page-interaction'
    | 'source-link-click'
    | 'response-body-link-click'
    | 'transform'
    | 'footer-info-link-click'
    | 'file-click'
    | 'form-action-click'

export type ExtensionMessage = Record<string, any> & { command: MessageCommand }
