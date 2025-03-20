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