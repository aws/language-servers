export type GumbyMessageType =
    | 'errorMessage'
    | 'asyncEventProgressMessage'
    | 'authenticationUpdateMessage'
    | 'authNeededException'
    | 'chatPrompt'
    | 'chatMessage'
    | 'chatInputEnabledMessage'
    | 'sendCommandMessage'
    | 'updatePlaceholderMessage'