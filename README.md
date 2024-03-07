# Language Servers for AWS

Language servers for integration with IDEs and Editors

## Structure

Monorepo

```
.
── app - binaries for distribution and integration into IDEs
    └── aws-lsp-buildspec-binary - application binaries (win/mac/linux) containing the buildspec language server
    └── aws-lsp-cloudformation-binary - application binaries (win/mac/linux) containing the CloudFormation language server
    └── aws-lsp-s3-binary - application binaries (win/mac/linux) containing the S3 language server
── client - Sample LSP integrations for various IDEs.
            Used to test out the Language Servers
    └── jetbrains/ - Minimal JetBrains extension to test the language server
    └── visualStudio/ - Minimal Visual Studio extension to test the language server
    └── vscode/ - Minimal vscode extension to test the language server
── core - contains supporting libraries used by app and server packages
    └── aws-lsp-core - core support code
    └── aws-lsp-json-common - reusable code related to JSON language service handling
    └── aws-lsp-yaml-common - reusable code related to YAML language service handling
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
    └── aws-lsp-yaml-json - Language Server that wraps a JSON Schema and provides support for JSON and YAML formats
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
