# Device Auth Language Server

This is an example implementation of Device authentication SSO flow for AWS Language Servers project.

It is port of [SSO flow implementation in VSCode sample client](../../client/vscode/src/sso/builderId.ts), but as LSP server.

[`SsoAuthServer`](./src/language-server/SsoAuthServer.ts) Server implementation is the entry point for this Server. 

Supports only [`standalone`](https://github.com/aws/language-server-runtimes/blob/main/runtimes/runtimes/standalone.ts) AWS Server Runtime, as it requires NodeJS `fs` access.

## Configuration

Configure Auth language server by passing `configurationOptions` at LSP Initialize handshake from LSP client. Capability supports next `configurationOptions`:

```typescript
interface InitializeParams {
    initializationOptions: {
        // Path to writable directory to store SSO auth and refresh token cache
        // Default: $HOMEDIR/.aws/device-sso-lsp/cache
        tokenCacheLocation?: string
    }
}
```

## Supported features

### Custom commands

Commands sent from client to server using [workspace/executeCommand](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#workspace_executeCommand) LSP capability.

### ssoAuth/authDevice/getToken command

When this command is invoked, it will initiate SSO Device Authentication flow using provided Identity Provider URL. Server prompts Client to display message when called.

When device is authenticated and bearer token is resolved, token will be cached on the filesystem.

Cached token data will be used in subsequent calls to refresh token, instead of invoking the flow again.

Params: 
```typescript
{
    /**
     * Command identifier
     */
    command: "ssoAuth/authDevice/getToken",
    arguments?: {
        /**
         * Identity provide URL for authentication. Defaults to 'https://view.awsapps.com/start', if not set.
         */
       startUrl?: string
    }
}
```

Response: 
```typescript
{
    /**
     * Bearer token resolved after SSO flow completed.
     */
    token: string
}
```