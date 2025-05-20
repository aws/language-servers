# Q Chat Client

This package contains a chat client for the Q Language Server, that can be embedded in a webview. It uses [MynahUI](https://github.com/aws/mynah-ui) to render a web based chat interface.

## Communication

The chat client communicates with the host application (e.g., an IDE extension) through `postMessage` requests to the webview:

- When the host application sends a request, the client processes the message and sends it to the UI
- When an event is triggered in the UI, the client sends a message through `postMessage` to the host application that rendered the chat client

## Usage

To use the chat client, embed it in a webview within your application and handle the `postMessage` communication as needed. Chat client is based on inbound (from a destination to the chat client) and outbound events (from the chat client to a destination). Events consist of `command` and `params`:

```
interface SomeEvent {
    command: string;
    params: SomeOptions;
}
```

### Inbound events

| Name                           | Description                                              | command                                | params                                                                                                                                                                                         |
| ------------------------------ | -------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| sendChatPrompt response        | Provides response to sendChatPrompt request              | `aws/chat/sendChatPrompt`              | [ChatResult](https://github.com/aws/language-server-runtimes/blob/10e67de47600f20bf090ce8ec0ea318038a387f2/types/chat.ts#L77C18-L77C28)                                                        |
| openTab request                | Request to open tab (creates tab if no `tabId` provided) | `aws/chat/openTab`                     | requestID - ID shared between the webview and vscode client, [OpenTabParams](https://github.com/aws/language-server-runtimes/blob/10e67de47600f20bf090ce8ec0ea318038a387f2/types/chat.ts#L200) |
| sendToPrompt                   | Request to send selection to prompt                      | `sendToPrompt`                         | [SendToPromptParams](https://github.com/aws/language-server-runtimes/blob/fe2669c34479d4925f2bdbe5527417ea8aed6c39/chat-client-ui-types/src/uiContracts.ts#L50C18-L50C36)                      |
| genericCommand                 | Request to execute generic command                       | `genericCommand`                       | [GenericCommandParams](https://github.com/aws/language-server-runtimes/blob/fe2669c34479d4925f2bdbe5527417ea8aed6c39/chat-client-ui-types/src/uiContracts.ts#L76)                              |
| errorMessage                   | Request to show error in chat UI                         | `errorMessage`                         | [ErrorParams](https://github.com/aws/language-server-runtimes/blob/fe2669c34479d4925f2bdbe5527417ea8aed6c39/chat-client-ui-types/src/uiContracts.ts#L88C18-L88C29)                             |
| chatOptions                    | Configures chat startup options                          | `chatOptions`                          | [ChatOptions](https://github.com/aws/language-server-runtimes/blob/main/types/chat.ts#L127)                                                                                                    |
| chatUpdate                     | Updates existing chat messages                        | `aws/chat/sendChatUpdate`                  | [ChatUpdateParams](https://github.com/aws/language-server-runtimes/blob/112feba70219a98a12f13727d67c540205fa9c9f/types/chat.ts#L355)        |
| contextCommand                 | Sends context commands to the UI                         | `aws/chat/sendContextCommands`              | [ContextCommandParams](https://github.com/aws/language-server-runtimes/blob/112feba70219a98a12f13727d67c540205fa9c9f/types/chat.ts#L393) |
| listConversations response     | Provides response with list of history conversations to the UI           | `aws/chat/listConversations`           | [ListConversationsResult](https://github.com/aws/language-server-runtimes/blob/112feba70219a98a12f13727d67c540205fa9c9f/types/chat.ts#L478)                                             |
| conversationClick response     | Provides response to conversation click or action, specifying action execution result          | `aws/chat/conversationClick`           | [ConversationClickResult](https://github.com/aws/language-server-runtimes/blob/112feba70219a98a12f13727d67c540205fa9c9f/types/chat.ts#L512)             |
| getSerializedChat request      | Request to get serialized chat                           | `aws/chat/getSerializedChat`           | [GetSerializedChatParams](https://github.com/aws/language-server-runtimes/blob/112feba70219a98a12f13727d67c540205fa9c9f/types/chat.ts#L550)                                    |
| chatOptionsUpdate              | Sends chat options update request from server                                   | `aws/chat/chatOptionsUpdate`           | [ChatOptionsUpdateParams](https://github.com/aws/language-server-runtimes/blob/112feba70219a98a12f13727d67c540205fa9c9f/types/chat.ts#L365)                                           |

### Outbound events

| Name                        | Description                                                                | command                                      | params                                                                                                                                                                                                                                                                                                                                               |
| --------------------------- | -------------------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| openTab response            | Provides response to openTab request                                       | `aws/chat/openTab`                           | requestID - ID shared between the webview and vscode client, [UiMessageResultParams](https://github.com/aws/language-server-runtimes/blob/10e67de47600f20bf090ce8ec0ea318038a387f2/chat-client-ui-types/src/uiContracts.ts#L129) with `result` of type [OpenTabResult](https://github.com/aws/language-server-runtimes/blob/main/types/chat.ts#L201) |
| disclaimerAcknowledged     | Notifies destination that legal disclaimer was acknowledged by a user      | `disclaimerAcknowledged`                     | N/A                                                                                                                                                                                                                                                                                                                                                  |
| sendChatPrompt             | Sends a chat prompt to the server                                          | `aws/chat/sendChatPrompt`                    | [ChatParams](https://github.com/aws/language-server-runtimes/blob/112feba70219a98a12f13727d67c540205fa9c9f/types/chat.ts#L87)                                                               |
| sendQuickActionCommand     | Sends a quick action command                                               | `aws/chat/quickAction`                       | [QuickActionParams](https://github.com/aws/language-server-runtimes/blob/112feba70219a98a12f13727d67c540205fa9c9f/types/chat.ts#L261)                                                  |
| tabAdded                   | Notifies when a tab is added                                               | `aws/chat/tabAdd`                            | [TabAddParams](https://github.com/aws/language-server-runtimes/blob/112feba70219a98a12f13727d67c540205fa9c9f/types/chat.ts#L288)                       |
| tabChanged                 | Notifies when a tab is changed                                             | `aws/chat/tabChange`                         | [TabChangeParams](https://github.com/aws/language-server-runtimes/blob/112feba70219a98a12f13727d67c540205fa9c9f/types/chat.ts#L290)                                   |
| tabRemoved                 | Notifies when a tab is removed                                             | `aws/chat/tabRemove`                         | [TabRemoveParams](https://github.com/aws/language-server-runtimes/blob/112feba70219a98a12f13727d67c540205fa9c9f/types/chat.ts#L292)                                                             |
| insertToCursorPosition     | Requests to insert code at cursor position                                 | `insertToCursorPosition`                     | [InsertToCursorPositionParams](https://github.com/aws/language-server-runtimes/blob/112feba70219a98a12f13727d67c540205fa9c9f/types/chat.ts#L294)                             |
| copyToClipboard            | Requests to copy code to clipboard                                         | `copyToClipboard`                            | [CopyCodeToClipboardParams](https://github.com/aws/language-server-runtimes/blob/112feba70219a98a12f13727d67c540205fa9c9f/chat-client-ui-types/src/uiContracts.ts#L142)                     |
| authFollowUpClicked        | Notifies when an auth follow-up is clicked                                 | `authFollowUpClicked`                        | [AuthFollowUpClickedParams](https://github.com/aws/language-server-runtimes/blob/112feba70219a98a12f13727d67c540205fa9c9f/chat-client-ui-types/src/uiContracts.ts#L84)              |
| followUpClicked            | Notifies when a follow-up suggestion is clicked                            | `aws/chat/followUpClick`                     | [FollowUpClickParams](https://github.com/aws/language-server-runtimes/blob/112feba70219a98a12f13727d67c540205fa9c9f/types/chat.ts#L320)                                                          |
| sendFeedback               | Sends user feedback                                                        | `aws/chat/feedback`                          | [FeedbackParams](https://github.com/aws/language-server-runtimes/blob/112feba70219a98a12f13727d67c540205fa9c9f/types/chat.ts#L278)                                                 |
| linkClick                  | Notifies when a link is clicked                                            | `aws/chat/linkClick`                         | [LinkClickParams](https://github.com/aws/language-server-runtimes/blob/112feba70219a98a12f13727d67c540205fa9c9f/types/chat.ts#L312)                                                             |
| sourceLinkClick            | Notifies when a source link is clicked                                     | `aws/chat/sourceLinkClick`                   | [SourceLinkClickParams](https://github.com/aws/language-server-runtimes/blob/112feba70219a98a12f13727d67c540205fa9c9f/types/chat.ts#L316)                                                  |
| infoLinkClick              | Notifies when an info link is clicked                                      | `aws/chat/infoLinkClick`                     | [InfoLinkClickParams](https://github.com/aws/language-server-runtimes/blob/112feba70219a98a12f13727d67c540205fa9c9f/types/chat.ts#L307)                                                       |
| uiReady                    | Notifies when the UI is ready                                              | `aws/chat/ready`                             | N/A |
| chatPromptOptionAcknowledged | Notifies when a chat prompt option is acknowledged                       | `chatPromptOptionAcknowledged`               | [ChatPromptOptionAcknowledgedParams](https://github.com/aws/language-server-runtimes/blob/112feba70219a98a12f13727d67c540205fa9c9f/chat-client-ui-types/src/uiContracts.ts#L107C18-L107C52)                                           |
| createPrompt               | Requests to create a prompt                                                | `aws/chat/createPrompt`                      | [CreatePromptParams](https://github.com/aws/language-server-runtimes/blob/112feba70219a98a12f13727d67c540205fa9c9f/types/chat.ts#L397)                                           |
| fileClick                  | Notifies when a file is clicked                                            | `aws/chat/fileClick`                         | [FileClickParams](https://github.com/aws/language-server-runtimes/blob/112feba70219a98a12f13727d67c540205fa9c9f/types/chat.ts#L371)                                  |
| listConversations          | Requests to list conversations with filter provided                | `aws/chat/listConversations`                 | [ListConversationsParams](https://github.com/aws/language-server-runtimes/blob/112feba70219a98a12f13727d67c540205fa9c9f/types/chat.ts#L463)                                           |
| conversationClick          | Notifies when a conversation is clicked                                    | `aws/chat/conversationClick`                 | [ConversationClickParams](https://github.com/aws/language-server-runtimes/blob/112feba70219a98a12f13727d67c540205fa9c9f/types/chat.ts#L507)                                  |
| tabBarAction               | Notifies when a tab bar action is requested                                | `aws/chat/tabBarAction`                      | [TabBarActionParams](https://github.com/aws/language-server-runtimes/blob/112feba70219a98a12f13727d67c540205fa9c9f/types/chat.ts#L541)                                              |
| getSerializedChat response | Provides response to getSerializedChat request                             | `aws/chat/getSerializedChat`                 | [GetSerializedChatResult](https://github.com/aws/language-server-runtimes/blob/112feba70219a98a12f13727d67c540205fa9c9f/types/chat.ts#L554)          |

### Configuration

Configuration can be passed as an explicit parameter when creating chat inside of webview, for example:

```
amazonQChat.createChat(acquireVsCodeApi(), configuration);
```

Configuration values:

```
// Configures quick actions
quickActionCommands?: QuickActionCommandGroup[]

// Configures chat client not to show legal disclaimer as it has already been acknowledged before
disclaimerAcknowledged?: boolean
```
