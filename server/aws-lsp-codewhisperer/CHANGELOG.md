# Changelog

## [0.0.15] - 2024-10-09

### Added

- Amazon Q Configuration: Amazon Q Configuration Server and implement fetching available Q Customizations (#462).
- Amazon Q Inline Code Completions: Supplemental cross-file context for source code for `java`, `python`, `javascript`, `typescript`, `javascriptreact`, `typescriptreact` language ids (#463).

### Fixed

- .Net Transform: Add transform logSuggestionForFailureResponse (#483)
- .Net Transform: Add logging when polling get transformation status failed (#476).
- .Net Transform: Add target framework and fix bug in copy file logic (#477).
- .Net Transform: Specify StartTransformation error message (#468).

## [0.0.14] - 2024-09-13
- .Net Transform: Removing manually setting job status to failed after any error from CodeWhisperer API

## [0.0.13] - 2024-09-02
- Set customUserAgent for SDK calls in Q Servers
- Add retry to pollTransformation
- Fix autotrigger - LF
- Add sql to supported file types
- Fix: failed to upload due to cert validation failed

## [0.0.12] - 2024-08-19
- Allow sending document without active focus in Chat requests

## [0.0.11] - 2024-08-14
- Fix issue with source framework selection on transform

## [0.0.10] - 2024-07-29
- **Feature**: Add Q .NET Transform Server
- Add default response for "How can Amazon Q help me?"
- Allow "0" to be used as partial token in chat handler

## [0.0.9] - 2024-07-01
- Update security scans to exclude gitignored files

## [0.0.8] - 2024-06-26
- Create new streaming client on each request

## [0.0.7] - 2024-06-26
- Implemented chat server logic
- fix: send 'x-amzn-codewhisperer-optout' header with IAM server
- Update the streaming client

## [0.0.6] - 2024-05-23
- Send telemetry for vote, copyCodeToClipboard and authFollowUpClicked events
- Rename CodeWhisperer to Amazon Q

## [0.0.5] - 2024-05-15
- Create Chat server export it for consumption
- Fix duplicate hover message in security scan
- Clear security scan finding when a project is unloaded
- Fix the consumption of streaming client
- Add `json`, `yaml` and `java` to list of supported languages

## [0.0.4] - 2024-03-28
- Integrate dependency graph with RunSecurityScan function
- Add server for transform feature
- Add diagnostics, handle hover for security scan findings, handler for cancel scan, and security scan telemetry event
- Migrate consumption of `@aws/language-server-runtimes` from local to NPMJS

## [0.0.3] - 2024-02-01
- Add support for using AWS SDK through proxy

## [0.0.2] - 2023-11-21
- Initial release supporting telemetry, session management, authentication, context matching and auto-trigger
