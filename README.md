# AWS Documents Language Server

Language server for AWS File types

## Functionality

This Language Server currently supports completion, hover, diagnostics for the following file types:

-   Buildspec

## Structure

```
.
── src
    └── client
        └── vscode/ - Minimal vscode extension to test the language server
    └── server
        └── server.ts - Language Server entry point
        └── registry.ts - Registry of items
        └── service.ts - Interfaces for Language Service and implementation of Backend Services that we call into (json language service, yaml language service)
        └── utils/ - Utilities for general functionality
        └── filetypes/ - Folder where filetype implementations live
── test
    └── unit/ - Unit tests
        └── ... - These directories mirror src
    └── integration/ - Integration tests
        └── ... - These directories mirror src
```

## How To Contribute

[How to contribute to the language server.](CONTRIBUTING.md#contributing)

## Building The Language Server

[How to build the language server.](CONTRIBUTING.md#building-the-language-server)

## Troubleshooting

[Troubleshooting information.](CONTRIBUTING.md#troubleshooting)
