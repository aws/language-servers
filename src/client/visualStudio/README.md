# Proof of Concept: AWS Documents LSP Client integration into Visual Studio

This is an example Visual Studio extension that wraps the experimental LSP service. When loading .yml and .yaml files, it will activate. The LSP service contains the logic that filters/handles files. During proof of concept, this included "build.yml" and "build.yaml" files.

## Try it out

-   compile the lsp service (elsewhere), produce a windows executable for the service
-   copy the executable to `C:\code\aws-toolkit-common\lsp`, or update `CreateLspProcess` in ToolkitLspClient.cs to point at your exe location
-   build this extension, and debug it (or otherwise run an experimental instance of Visual Studio)
-   open a build.yaml file and try authoring a buildspec file

## What Works

-   hover
-   validation
-   autocompletion
-   runs on a system that doesn't have node installed

## Caveats

-   the hover contents contain escape sequences. This is an artifact of the YAML handler used by the LSP service. The fix will be made on the backend.

## Diagnostic Tracing

Diagnostics tracing can be enabled to output all messages between the client and server, which can be useful when debugging issues. This extension has this enabled in `LspClientSettings.json`. If you open a folder in Visual Studio and interact with some files, the LSP tracing can be found in `%temp%\VSLogs` in a file named something like "VS3B4F7AF9.LSPClient.IdesLspPoc.LspClient.ToolkitLspClient.NHEX.svclog". You can double click this file to view it in the Microsoft Service Trace Viewer (part of the Windows SDK).

-   Reference: https://learn.microsoft.com/en-us/visualstudio/extensibility/adding-an-lsp-extension?view=vs-2022#enable-diagnostics-tracing

## Miscellaneous

-   if we choose to support custom file extensions, those files won't get coloring like yaml files do
    -   we'd have to set up TextMate grammars -- https://learn.microsoft.com/en-us/visualstudio/extensibility/adding-an-lsp-extension?view=vs-2022#textmate-grammar-files
-   while you have a debugger attached, performance is awful. Your experimental instance will freeze if you type in the file too fast. The performance is fine if you detach the debugger.
-   we will probably want to have the client send the server a list of file globs that it supports. This way we can tell the LSP what custom file extensions/filenames that it should handle
