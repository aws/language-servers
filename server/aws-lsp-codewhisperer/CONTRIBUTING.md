# Contribution Guide to @aws/lsp-codewhisperer


## Code structure

### Servers

The code whisperer capability is consist of the following [LSP servers](https://github.com/aws/language-server-runtimes/blob/main/runtimes/server-interface/server.ts):

- `agenticChat`
- `chat`
- `inline-completion`
- `netTransform`
- `securityScan`

New server should always be created in their own directory under [`./src/language-server/`](./src/language-server/).

Please make sure:

1. servers must be in a self-contained directory and not import files from each other.
1. shared code should be in `shared` directory to be used by more than one server.


### Client

  `client` directory contains the AWS SDK for JavaScript client to call CodeWhisperer service using either [AWS Signature Version 4 (SigV4)](https://docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-authenticating-requests.html) or [Builder ID (bearer token)](https://docs.aws.amazon.com/signin/latest/userguide/sign-in-aws_builder_id.html), which are two different ways to access Amazon Q Developer.


## Testing

`chat` will be deprecated and  `agenticChat` is the future supported "chat" interface. To test and debug the application, choose the launch configuration of "CodeWhisperer Agentic Server Token (language-servers)". You should see a VSCode instance for debugging the extension.

In order to use agentic chat, you need to login. You can find the option with <kbd>CMD</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd>, then choose "AWS LSP: Obtain bearer token and send to LSP server - Builder ID".

Some features such as workspace indexing library requires a workspace to be opened in the VSCode debug instance. You can open a workspace using the menu just like using a normal VSCode.