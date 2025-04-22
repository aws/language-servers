import {
    ChatParams,
    FeedbackParams,
    FollowUpClickParams,
    InfoLinkClickParams,
    LinkClickParams,
    SourceLinkClickParams,
    TabAddParams,
    TabChangeParams,
    TabRemoveParams,
    CHAT_REQUEST_METHOD,
    TAB_ADD_NOTIFICATION_METHOD,
    TAB_CHANGE_NOTIFICATION_METHOD,
    TAB_REMOVE_NOTIFICATION_METHOD,
    READY_NOTIFICATION_METHOD,
    FOLLOW_UP_CLICK_NOTIFICATION_METHOD,
    FEEDBACK_NOTIFICATION_METHOD,
    LINK_CLICK_NOTIFICATION_METHOD,
    SOURCE_LINK_CLICK_NOTIFICATION_METHOD,
    INFO_LINK_CLICK_NOTIFICATION_METHOD,
    QUICK_ACTION_REQUEST_METHOD,
    OpenTabResult,
    OPEN_TAB_REQUEST_METHOD,
    CreatePromptParams,
    CREATE_PROMPT_NOTIFICATION_METHOD,
    FileClickParams,
    FILE_CLICK_NOTIFICATION_METHOD,
    LIST_CONVERSATIONS_REQUEST_METHOD,
    ListConversationsParams,
    CONVERSATION_CLICK_REQUEST_METHOD,
    ConversationClickParams,
    GET_SERIALIZED_CHAT_REQUEST_METHOD,
    TAB_BAR_ACTION_REQUEST_METHOD,
    TabBarActionParams,
    GetSerializedChatResult,
    PROMPT_INPUT_OPTION_CHANGE_METHOD,
    BUTTON_CLICK_REQUEST_METHOD,
} from '@aws/language-server-runtimes-types'

export const TELEMETRY = 'telemetry/event'

export type ServerMessageCommand =
    | typeof CHAT_REQUEST_METHOD
    | typeof TAB_ADD_NOTIFICATION_METHOD
    | typeof TAB_REMOVE_NOTIFICATION_METHOD
    | typeof TAB_CHANGE_NOTIFICATION_METHOD
    | typeof READY_NOTIFICATION_METHOD
    | typeof TELEMETRY
    | typeof FOLLOW_UP_CLICK_NOTIFICATION_METHOD
    | typeof FEEDBACK_NOTIFICATION_METHOD
    | typeof LINK_CLICK_NOTIFICATION_METHOD
    | typeof SOURCE_LINK_CLICK_NOTIFICATION_METHOD
    | typeof INFO_LINK_CLICK_NOTIFICATION_METHOD
    | typeof QUICK_ACTION_REQUEST_METHOD
    | typeof OPEN_TAB_REQUEST_METHOD
    | typeof CREATE_PROMPT_NOTIFICATION_METHOD
    | typeof FILE_CLICK_NOTIFICATION_METHOD
    | typeof LIST_CONVERSATIONS_REQUEST_METHOD
    | typeof CONVERSATION_CLICK_REQUEST_METHOD
    | typeof TAB_BAR_ACTION_REQUEST_METHOD
    | typeof GET_SERIALIZED_CHAT_REQUEST_METHOD
    | typeof PROMPT_INPUT_OPTION_CHANGE_METHOD
    | typeof BUTTON_CLICK_REQUEST_METHOD

export interface ServerMessage {
    command: ServerMessageCommand
    requestId?: string
    params?: ServerMessageParams
}

export type TelemetryParams = {
    name: string
    [key: string]: any
}

export type ServerMessageParams =
    | TabAddParams
    | TabChangeParams
    | TabRemoveParams
    | TelemetryParams
    | ChatParams
    | FeedbackParams
    | LinkClickParams
    | InfoLinkClickParams
    | SourceLinkClickParams
    | FollowUpClickParams
    | OpenTabResult
    | CreatePromptParams
    | FileClickParams
    | ListConversationsParams
    | ConversationClickParams
    | TabBarActionParams
    | GetSerializedChatResult
