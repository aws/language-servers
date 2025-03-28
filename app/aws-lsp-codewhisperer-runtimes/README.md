## Amazon Q Language Server Bundle Configuration

This package provides example configuration to produce Amazon Q server implementation bundled with [Language Server Runtimes for AS](https://github.com/aws/language-server-runtimes).

To create compiled bundles run:
```bash
npm run package
```

This command will compile package and produce 2 bundled Javascript programs in `./out/` directory: 
- `./out/iam-standalone.js` - Amazon Q server using IAM Credentials provider
- `./out/token-standalone.js` - Amazon Q server using Bearer Token SSO Credentials provider

To test server you can use sample IDEs client in [`./client`](../../client) subpackages. In VSCode, you can use "Run and Debug" functionality with [sample client extension](../../CONTRIBUTING.md#with-minimal-vscode-client) and update `launch.json` configuration to point to [compiled bundle file](../../.vscode/launch.json#L60). Change value for `LSP_SERVER` valiable from `${workspaceFolder}/app/aws-lsp-codewhisperer-runtimes/out/index.js` to `${workspaceFolder}/app/aws-lsp-codewhisperer-runtimes/out/token-standalone.js`.

To verify compiled bundle can run, you can start it in your shell with NodeJS:

```bash
node ./out/token-standalone.js --stdio
```

or

```bash
node ./out/iam-standalone.js --stdio
```

## Development and Testing Web Worker Implementation

For development and testing purposes, you can use the `start` script (after bundling with the `package` script) to run a development server that helps validate the web worker bundled implementation and basic language server communication:

```
npm run start
```
This command starts a webpack development server (default: http://127.0.0.1:8080) that serves a basic setup to test:

- Web worker bundling and server initialization at runtime

- Basic language client/server communication

The development server uses `webpack-dev-server` configuration from `webpack.config.js` to serve both the main webpage and the web worker bundle, allowing real-time testing of the language server implementation in a browser environment.

### End-to-End Testing
This package includes end-to-end testing capabilities using WebdriverIO to validate the web worker implementation at runtime. To run the tests:
```bash
npm run test
```
This command performs the following steps:
1. Bundles the package using webpack (via `npm run package`)
2. Starts the development server (via `npm run start`)
3. Runs WebdriverIO tests that:
    - Launches a headless Chrome browser
    - Connects to the development server (http://localhost:8080)
    - Validates the web worker initialization by checking for any runtime console errors
4. Stops the development server (via `npm run stop`), this command executes `kill-dev-server.sh` which safely terminates any process running on port 8080. This script is essential for cleanup after testing and supports both Unix-based systems (Linux/macOS) and Windows environments.


Tests configs are set in `wdio.conf.ts`, the test is implemented in `test/e2e` folder. Max timeout is 5 minutes (300000ms) to allow for the devhost to load the webpage with the bundled webworker which requires some time.
