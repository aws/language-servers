# CodeWhisperer Server

## Guides

### Proxy
To use the CodeWhisperer server behind a proxy, import the [`CodeWhispererServerTokenProxy`](./src/language-server/proxy-server.ts) as the server and set up the environment variable `HTTPS_PROXY` or `https_proxy` to the proxy URL you are using.
You can pass the environment variable to the process or just set it up globally on your system.

```
export HTTPS_PROXY=https://proxy.example.com:5678
export https_proxy=https://proxy.example.com:5678
```

or

```
export HTTPS_PROXY=http://username:password@proxy.example.com:5678
export https_proxy=http://username:password@proxy.example.com:5678
```

### Bundling with webworker runtime
Amazon Q Servers implemented in this package may have dependencies on NodeJS native modules, not available in non-Node.js environments.

To make cross-platform bundle, use bundler that allow overriding modules with compatible alternatives (e.g. Webpack).

NodeJS modules used in this package

- CodeWhispererServer:
  - `path`
- SecurityScanServer:
  - `path`, `os`

To override modules use next alternatives:
- `path` - https://www.npmjs.com/package/path-browserify
- `os` - https://www.npmjs.com/package/os-browserify

## Configuration

Language Servers support different configurations and can be configured using the following environment variables:

- `AWS_Q_REGION`: The AWS region for Amazon Q services (default: us-east-1)
- `AWS_Q_ENDPOINT_URL`: The endpoint URL for Amazon Q services

### LSP Configuration Options

LSP configuration options that can be set through the LSP client's `workspace.getConfiguration` protocol:

1. `aws.q` section:
   - `customization`: (string) Sets the customization ARN for Amazon Q. To be used with [`QConfigurationServer`](../language-server/configuration/qConfigurationServer.ts)
   - `preselectSuggestionFromQ`: (boolean, default: true) Determines whether suggestions from Amazon Q should be preselected in response from `textDocument/completion`.

2. `aws.codeWhisperer` section:
   - `includeSuggestionsWithCodeReferences`: (boolean, default: true) Controls whether suggestions that include code references should be included in the results.
   - `shareCodeWhispererContentWithAWS`: (boolean, default: false) Determines whether the content processed by CodeWhisperer should be shared with AWS for service improvement.