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


