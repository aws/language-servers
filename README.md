# AWS Documents Language Server

Language servers for AWS Document types

## Functionality

This Language Server will initially support completion, hover, diagnostics for select document types. The plan is to use JSON Schemas for certain documents, but we will explore additional language servers as well.

## Structure

Monorepo

```
.
── app - binaries for distribution and integration into IDEs
    └── aws-lsp-buildspec-binary - application binaries (win/mac/linux) containing the buildspec language server
    └── aws-lsp-cloudformation-binary - application binaries (win/mac/linux) containing the CloudFormation language server
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
```

## How To Contribute

[How to contribute to the language server.](CONTRIBUTING.md#contributing)

## Building The Language Server

[How to build the language server.](CONTRIBUTING.md#building-the-language-server)

## Troubleshooting

[Troubleshooting information.](CONTRIBUTING.md#troubleshooting)
