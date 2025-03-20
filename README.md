# Language Servers for AWS

Language servers for integration with IDEs and Editors, which implement the protocol (LSP extensions) defined in the [language-server-runtimes](https://github.com/aws/language-server-runtimes/tree/main/runtimes) repo.

## Where things go

- To create a new language capability, see the example [hello-world-lsp](server/hello-world-lsp) server and its [implementation](app/hello-world-lsp-runtimes) (using our runtime), and [run it](https://github.com/aws/language-servers/blob/main/CONTRIBUTING.md#with-vscode-toolkit-extension).
    - For a more complex (real-world) example, see the [Amazon Q language server](server/aws-lsp-codewhisperer).
- To create a new protocol feature (LSP extension) for all language servers: contribute to the [language-server-runtimes](https://github.com/aws/language-server-runtimes/tree/main) repo.

## Structure

Monorepo

- [app/](app) - bundled javascript runtime applications for distribution and integration into IDEs
    - [aws-lsp-buildspec-runtimes/](app/aws-lsp-buildspec-runtimes) - application containing the buildspec language server
    - [aws-lsp-cloudformation-runtimes/](app/) - application containing the CloudFormation language server
    - [aws-lsp-s3-runtimes/](app/aws-lsp-buildspec-runtimes) - application containing the S3 language server
- [client/](client) - Sample LSP integrations for various IDEs. Used to test out the Language Servers
    - [jetbrains/](client/jetbrains/) - Minimal JetBrains extension to test the language server
    - [visualStudio/](client/visualStudio/) - Minimal Visual Studio extension to test the language server
    - [vscode/](client/vscode/) - Minimal vscode extension to test the language server
- [core/](core) - contains supporting libraries used by app and server packages
    - [aws-lsp-core](core/aws-lsp-core) - core support code
- [script](script) - loose scripts used to create `npm foo` commands in the root folder
- [server](server) - packages that contain Language Server implementations
    - [aws-lsp-buildspec](server/aws-lsp-buildspec) - Language Server that wraps a JSON Schema for CodeBuild buildspec
    - [aws-lsp-cloudformation](server/aws-lsp-cloudformation) - Language Server that wraps a JSON Schema for CloudFormation
    - [aws-lsp-codewhisperer](server/aws-lsp-codewhisperer) - Language Server that surfaces CodeWhisperer recommendations.
        - Shows recommendations through completion lists and as ghost text>
    - [aws-lsp-s3](server/aws-lsp-s3) - Example language server that provides S3 bucket names as completion items
        - Shows a concept where credentials can be provided from an IDE
          extension (See vscode and vs client readmes)
    - [aws-lsp-json](server/aws-lsp-json) - Language Server that wraps a JSON Schema and provides
      support for JSON format. Includes reusable code related to JSON language
      service handling.
    - [aws-lsp-yaml](server/aws-lsp-yaml) - Language Server that wraps a JSON Schema and provides
      support for YAML format. Includes reusable code related to YAML language
      service handling.

## Contributing

- [How to contribute](CONTRIBUTING.md#contributing)
- [How to build](CONTRIBUTING.md#building-the-repo)
- [Troubleshooting](CONTRIBUTING.md#troubleshooting)

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This project is licensed under the Apache-2.0 License.
