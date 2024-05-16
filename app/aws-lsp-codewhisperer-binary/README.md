## Amazon Q Language Server Bundle Configuration

This package provides example configuration to produce Amazon Q server implementation bundled with [Language Server Runtimes for AS](https://github.com/aws/language-server-runtimes).

To create bundle run:
```bash
npm run bundle
```

This command will compile package and produce bundled Javascript program at `./out/aws-lsp-codewhisperer-binary.js` path.

To test server you can use sample IDEs client in [`./client`](../../client) subpackages. In VSCode, you can use "Run and Debug" functionality with [sample client extension](../../CONTRIBUTING.md#with-minimal-vscode-client) and update `launch.json` configuration to point to [compiled bundle file](../../.vscode/launch.json#L60). Change value for `LSP_SERVER` valiable from `${workspaceFolder}/app/aws-lsp-codewhisperer-binary/out/index.js` to `${workspaceFolder}/app/aws-lsp-codewhisperer-binary/out/aws-lsp-codewhisperer-binary.js`.

To verify compiled bundle can run, you can start it in your shell with NodeJS:

```bash
node ./out/aws-lsp-codewhisperer-binary.js --stdio
```