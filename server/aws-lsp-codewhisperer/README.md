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