import { chatRequestType, ChatResult } from '@aws/language-server-runtimes/protocol'
import { v4 as uuidv4 } from 'uuid'
import { ViewColumn, window } from 'vscode'
import { LanguageClient } from 'vscode-languageclient/node'

function getCSS() {
    return `
    <style>
    /* Add some basic styling */
    body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
    }
    .chat-container {
        max-width: 600px;
        margin: 20px auto;
        border: 1px solid #ccc;
        border-radius: 5px;
        overflow: hidden;
    }
    .chat-header {
        background-color: #333;
        color: #fff;
        padding: 10px;
        text-align: center;
    }
    .chat-window {
        height: 500px;
        overflow-y: scroll;
        padding: 10px;
    }
    .chat-input {
        display: flex;
        padding: 10px;
        background-color: #f5f5f5;
    }
    .chat-input input[type="text"] {
        flex-grow: 1;
        padding: 5px;
    }
    .chat-message {
        margin-bottom: 10px;
    }
    .chat-message.human {
        background-color: #e6f3ff;
        padding: 10px;
        border-radius: 10px;
        align-self: flex-start;
    }
    .chat-message.ai {
        background-color: #dcf8c6;
        padding: 10px;
        border-radius: 10px;
        align-self: flex-end;
    }
</style>
    `
}

function getBody() {
    return `
    <div class="chat-container">
    <div class="chat-header">
        <h2>Chat UI</h2>
    </div>
    <div class="chat-window">
        <!-- Chat messages will be dynamically added here -->
    </div>
    <div class="chat-input">
        <input type="text" placeholder="Type your message...">
        <button>Send</button>
    </div>
</div>
`
}

function getWebviewContent() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat UI</title>
    ${getCSS()}
</head>
<body>
    ${getBody()}
    <script>
    const chatWindow = document.querySelector('.chat-window');
    const inputField = document.querySelector('.chat-input input[type="text"]');
    const sendButton = document.querySelector('.chat-input button');
    const vscode = acquireVsCodeApi();

    let aiMessageElement;

    window.addEventListener('message', (event) => {
        const message = event.data;
        if (message.type === 'aiResponse') {
            aiMessageElement = null;
        }
        else if (message.type === 'aiResponsePartial') {
            updateAIMessage(message.text);
        }
    });
    
    sendButton.addEventListener('click', sendMessage);
    inputField.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });
    
    function sendMessage() {
        const message = inputField.value.trim();
        if (message) {
            addMessageToChat(message, 'human');
            inputField.value = '';
            vscode.postMessage({ text: message });
        }
    }
    
    function addMessageToChat(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender);
        messageElement.textContent = message;

        // If it's an AI message, store the reference
        if (sender === 'ai') {
            aiMessageElement = messageElement;
        }

        chatWindow.appendChild(messageElement);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    } 

    function updateAIMessage(message) {
        if (aiMessageElement) {
            aiMessageElement.textContent = message;
        } else {
            // If no AI message element exists, create a new one
            addMessageToChat(message, 'ai');
        }
    }
    </script>
</body>
</html>`
}

export function registerChatCommand(languageClient: LanguageClient) {
    const panel = window.createWebviewPanel(
        'testChat', // Identifies the type of the webview. Used internally
        'Chat Test', // Title of the panel displayed to the user
        ViewColumn.Active, // Editor column to show the new webview panel in.
        { enableScripts: true } // Webview options
    )

    panel.webview.onDidReceiveMessage(message => {
        const partialResultToken = uuidv4()

        languageClient.onProgress(chatRequestType, partialResultToken, partialResult => {
            languageClient.info(`Client: Received ${JSON.stringify(partialResult)} partial result`)
            panel.webview.postMessage({ type: 'aiResponsePartial', text: partialResult.body })
        })

        let response = languageClient.sendRequest<ChatResult>(chatRequestType.method, {
            tabId: '12345',
            prompt: { prompt: message.text },
            partialResultToken: partialResultToken,
        })

        languageClient.info(`Client: Received ${JSON.stringify(response)} chat response promise`)

        response.then(resolvedValue => {
            languageClient.info('Client: Chat response resolved' + JSON.stringify(resolvedValue))
            panel.webview.postMessage({ type: 'aiResponse', text: resolvedValue.body })
        })
    }, undefined)

    panel.webview.html = getWebviewContent()
}
