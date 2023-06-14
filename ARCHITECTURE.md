# Architecture

Language support is implemented across three components: language services, language servers, and binaries.

![Langauge server architecture diagram](docs/images/language-server-architecture.svg)

## Language service

Language services are the inner-most language support component. They insulate a language's busines logic from language server protocol connections, and expose primitives that support a language server.

Language services are created by implementing the [AwsLanguageService](./core/aws-lsp-core/src/language-service/awsLanguageService.ts) interface. The interface is designed to closely follow the interfaces exposed by other VS Code language servers (primarily the JSON language server), because the rest of the Typescript code is built on top of the VS Code LSP libraries.

Business logic should be contained within (or accessed from) these implementations. Language services are intended to be reusable. Different language servers may compose one or more language services together, and a language service may be used from more than one language server.

To support the goal of providing language support in both browsers and client applications, components should be injected into language services that encapsulate concepts not supported by the browser (like file I/O, etc).

## Language server

Language servers implement the language server protocol (LSP). They accept requests from language clients, query the language service for details, and then send responses.

Language servers are wrappers around `AwsLanguageService` implementations.

Browser hosts directly instantiate language servers, and integrate them with the browser's language client.

## Binaries

A thin wrapper instantiates language servers, and injects them with components that are supported by desktop (non-browser) clients. This is bundled into a standalone binary (one for Windows, Mac, and Linux), that is capable of being run on a system that doesn't have nodejs installed.

Binaries can contain one or more language servers.

Desktop clients (IDE extensions) run the binaries as child processes, and provide the child process communication streams to the IDE.
