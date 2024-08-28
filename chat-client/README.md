# Q Chat Client

This package contains a chat client for the Q Language Server, that can be embedded in a webview. It renders the [MynahUI](https://github.com/aws/mynah-ui) library inside the webview.

## Communication

The chat client communicates with the host application (e.g., an IDE extension) through `postMessage` requests to the webview:

- When the host application sends a request, the client processes the message and sends it to the UI
- When an event is triggered in the UI, the client sends a message through `postMessage` to the host application that rendered the chat client

## Usage

To use the chat client, embed it in a webview within your application and handle the `postMessage` communication as needed.
