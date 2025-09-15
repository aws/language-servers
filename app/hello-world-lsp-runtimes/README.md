## Hello World Runtimes bundling example

This package demonstrates how to bundle Language Server with [AWS Language Server Runtimes](https://github.com/aws/language-server-runtimes/tree/main/runtimes/runtimes) for different target runtimes environments.

Runtimes supported include:
- [standalone](https://github.com/aws/language-server-runtimes/blob/main/runtimes/runtimes/standalone.ts) - bundling language server into standalone NodeJS executable program.
- [webworker](https://github.com/aws/language-server-runtimes/blob/main/runtimes/runtimes/webworker.ts) - bundling language server into webworker, running in web browser environment.

Source code examples of runtime bundle configuration in `/src` directory.

### Creating bundles

We use `webpack` to create javascript bundles to run with NodeJS or as a webworker.

Before creating runtime bundle, make sure that Hello World Language Server package is compiled:
```bash
cd ./language-servers/server/hello-world-lsp
npm run compile
```

To produce all bundles in this package, run:
```bash
npm run bundle
```

Bundling specific variants is also possible.
* To create javascript bundled files with webpack, run:
    ```bash
    npm run webpack
    ```

Result artifacts can be found in `/out` and `/build` directories.

#### Package structure

```
.
├── build - Budled Javascript runtime programms
│   ├── hello-world-lsp-standalone.js - standalone bundle
│   ├── hello-world-lsp-webworker.js - webworker bundle
├── out - Compiled Javascipt
│   ├── standalone.js
│   ├── webworker.js
├── src - source code configuration for bundling
│   ├── standalone.ts
└── └── webworker.ts
```

### Testing and running

To test build bundles, you can run standalone bundle locally using NodeJs:
```bash
node ./out/hello-world-lsp-standalone.js --stdio
```

You should see process logging JSON-RPC messages, indicating Runtime and Language Server features were initialised:

```
Content-Length: 127

{"jsonrpc":"2.0","method":"window/logMessage","params":{"type":3,"message":"Runtime: Initializing runtime without encryption"}}Content-Length: 130

{"jsonrpc":"2.0","method":"window/logMessage","params":{"type":3,"message":"Runtime: Registering IAM credentials update handler"}}Content-Length: 133

{"jsonrpc":"2.0","method":"window/logMessage","params":{"type":3,"message":"Runtime: Registering bearer credentials update handler"}}Content-Length: 153

{"jsonrpc":"2.0","method":"window/logMessage","params":{"type":3,"message":"[2024-05-14T10:16:02.618Z] The Hello World Capability has been initialised"}}
```