# Language Servers for AWS

Language servers for integration with IDEs and Editors

## Relation with Language Server Runtimes

This monorepo hosts language servers created using the [Language Server Runtimes](https://github.com/aws/language-server-runtimes/tree/main/runtimes)'s Server Interface. This enables the servers to use features provided by the Runtimes in the same package.

Want to create a new language capability? See our example [hello-world-lsp](server/hello-world-lsp) server and it's [implementation](app/hello-world-lsp-runtimes) (using our runtime), run it using the instructions provided [here](https://github.com/aws/language-servers/blob/main/CONTRIBUTING.md#with-vscode-toolkit-extension). To see a more complex example, see our [Amazon Q servers](server/aws-lsp-codewhisperer).

Want to create a new protocol or feature that would be available to all language servers? Head over to the [Language Server Runtimes repo](https://github.com/aws/language-server-runtimes/tree/main) and start building!

## Structure

Monorepo

```
.
── app - bundled javascriot runtime applications for distribution and integration into IDEs
    └── aws-lsp-buildspec-runtimes - application containing the buildspec language server
    └── aws-lsp-cloudformation-runtimes - application containing the CloudFormation language server
    └── aws-lsp-s3-runtimes - application containing the S3 language server
── client - Sample LSP integrations for various IDEs.
            Used to test out the Language Servers
    └── jetbrains/ - Minimal JetBrains extension to test the language server
    └── visualStudio/ - Minimal Visual Studio extension to test the language server
    └── vscode/ - Minimal vscode extension to test the language server
── core - contains supporting libraries used by app and server packages
    └── aws-lsp-core - core support code
── script - loose scripts used to create `npm foo` commands in the root folder
── server - packages that contain Language Server implementations
    └── aws-lsp-buildspec - Language Server that wraps a JSON Schema for CodeBuild buildspec
    └── aws-lsp-cloudformation - Language Server that wraps a JSON Schema for CloudFormation
    └── aws-lsp-codewhisperer - Language Server that surfaces CodeWhisperer recommendations
                              - experimental. Shows how recommendations can surface through
                                completion lists and as ghost text
    └── aws-lsp-s3 - Example language server that provides S3 bucket names as completion items
                   - Shows a concept where credentials can be provided from an IDE extension
                     (See vscode and vs client readmes)
    └── aws-lsp-json - Language Server that wraps a JSON Schema and provides support for JSON format. 
                            Includes reusable code related to JSON language service handling.
    └── aws-lsp-yaml - Language Server that wraps a JSON Schema and provides support for YAML format. 
                            Includes reusable code related to YAML language service handling.
```

## How To Contribute

[How to contribute to the language server.](CONTRIBUTING.md#contributing)

## Building The Language Server

[How to build the language server.](CONTRIBUTING.md#building-the-language-server)

## Troubleshooting

[Troubleshooting information.](CONTRIBUTING.md#troubleshooting)

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This project is licensed under the Apache-2.0 License.
