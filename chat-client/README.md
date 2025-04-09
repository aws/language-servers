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

| Name                    | Description                                              | command                   | params                                                                                                                                                                    |
| ----------------------- | -------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| sendChatPrompt response | Provides response to sendChatPrompt request              | `aws/chat/sendChatPrompt` | [ChatResult](https://github.com/aws/language-server-runtimes/blob/10e67de47600f20bf090ce8ec0ea318038a387f2/types/chat.ts#L77C18-L77C28)                                   |
| openTab request         | Request to open tab (creates tab if no `tabId` provided) | `aws/chat/openTab`        | requestID - ID shared between the webview and vscode client, [OpenTabParams](https://github.com/aws/language-server-runtimes/blob/10e67de47600f20bf090ce8ec0ea318038a387f2/types/chat.ts#L200)                                         |
| sendToPrompt            | Request to send selection to prompt                      | `sendToPrompt`            | [SendToPromptParams](https://github.com/aws/language-server-runtimes/blob/fe2669c34479d4925f2bdbe5527417ea8aed6c39/chat-client-ui-types/src/uiContracts.ts#L50C18-L50C36) |
| genericCommand          | Request to execute generic command                       | `genericCommand`          | [GenericCommandParams](https://github.com/aws/language-server-runtimes/blob/fe2669c34479d4925f2bdbe5527417ea8aed6c39/chat-client-ui-types/src/uiContracts.ts#L76)         |
| errorMessage            | Request to show error in chat UI                         | `errorMessage`            | [ErrorParams](https://github.com/aws/language-server-runtimes/blob/fe2669c34479d4925f2bdbe5527417ea8aed6c39/chat-client-ui-types/src/uiContracts.ts#L88C18-L88C29)        |
| chatOptions             | Configures chat startup options                          | `chatOptions`             | [ChatOptions](https://github.com/aws/language-server-runtimes/blob/main/types/chat.ts#L127)                                                                               |

### Outbound events

| Name                   | Description                                                           | command                  | params                                                                                                                                                                                                                                                                                  |
| ---------------------- | --------------------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| openTab response       | Provides response to openTab request                                  | `aws/chat/openTab`       | requestID - ID shared between the webview and vscode client, [UiMessageResultParams](https://github.com/aws/language-server-runtimes/blob/10e67de47600f20bf090ce8ec0ea318038a387f2/chat-client-ui-types/src/uiContracts.ts#L129) with `result` of type [OpenTabResult](https://github.com/aws/language-server-runtimes/blob/main/types/chat.ts#L201) |
| disclaimerAcknowledged | Notifies destination that legal disclaimer was acknowlegded by a user | `disclaimerAcknowledged` | N/A                                                                                                                                                                                                                                                                                     |

TODO: Provide full list of events

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
