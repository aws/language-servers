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

### Fetching Amazon Q configuration(s)

The following Amazon Q configurations can be fetched with the `aws/getConfigurationFromServer` request exposed by [QConfigurationServer](https://github.com/aws/language-servers/blob/main/server/aws-lsp-codewhisperer/src/language-server/configuration/qConfigurationServer.ts):

- customizations
- developer profiles

The request expects a `section` parameter, recognizing the following options:

- `aws.q`
    - `aws.q.customizations`
    - `aws.q.developerProfiles`

Example:

```ts
await languageClient.sendRequest(getConfigurationFromServerRequestType.method, {
            section: 'aws.q',
        })
// result:
{
  'customizations': [customization1, customization2, ...],
  'developerProfiles': [profile1, profile2, ...] // (if enabled)
}
```

Granular requests such as `aws.q.customizations` will only return that particular configuration.

Example:

```ts
await languageClient.sendRequest(getConfigurationFromServerRequestType.method, {
            section: 'aws.q.customizations',
        })
// result:
[customization1, customization2, ...]
```

#### Developer Profiles

By default, developer profiles are not fetched. To enable the fetching, the client needs to signal support for them at initialization in the `InitializeParams`.

Example:

```ts
const params: InitializeParams = {
  // ...
  aws: {
    // ...
    awsClientCapabilities: {
      q: {
        developerProfiles: true
      }
    }
  }
}
```
