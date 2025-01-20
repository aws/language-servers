# Amazon Q Completions and Device SSO Token server

This package provides example configuration to produce Amazon Q server implementation bundled with [Language Server Standalone Runtime](https://github.com/aws/language-server-runtimes).

Language Server contains:
- `SsoAuthServer`: support for Device authentication SSO flow from [`amzn/device-sso-auth-lsp`](../../server/device-sso-auth-lsp/) package.
- `AmazonQCompletionServerToken`: experimental implementation of [Amazon Q Developer Code Completions](../../server/aws-lsp-codewhisperer/src/experimental/README.md) with standard LSP `textDocument/completion` protocol.
- `CodeWhispererServerTokenProxy`: support of Amazon Q `InlineCompletionWithReferences`.
- `QChatServerProxy`: support of Amazon Q Chat server.

## Installation and usage

To create compiled bundle run:
```bash
npm run package
```

This command will compile package and produce bundled Javascript server in `./out/` directory: 
- `./out/completions-with-device-sso.js` - Amazon Q server bundled application.

To verify compiled bundle can run, you can start it in your shell with NodeJS:
```bash
node ./out/completions-with-device-sso.js --stdio
```