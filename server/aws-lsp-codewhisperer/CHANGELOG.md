# Changelog

## [0.0.29](https://github.com/aws/language-servers/compare/lsp-codewhisperer/v0.0.28...lsp-codewhisperer/v0.0.29) (2025-03-26)


### Features

* abort all inflight requests when resetCodewhispererService is invoked ([#848](https://github.com/aws/language-servers/issues/848)) ([681889b](https://github.com/aws/language-servers/commit/681889bd40a0fb84ea624f177b07ef579864303a))
* added auth listener to reset the service manager state in case of bearer token signout ([#842](https://github.com/aws/language-servers/issues/842)) ([780be3f](https://github.com/aws/language-servers/commit/780be3fdb92917e58524472ea5967f405f802db5))
* **amazonq:** accept extra context for Q Inline Suggestions ([4a508df](https://github.com/aws/language-servers/commit/4a508dfcba714301145089263bdce8b8f18ec03b))
* **amazonq:** add eu-central-1 endpoint ([83133d6](https://github.com/aws/language-servers/commit/83133d61815c5acfba7ead1c87d0aaef206e72d4))
* **amazonq:** add regionalization support to security scan server ([#859](https://github.com/aws/language-servers/issues/859)) ([9945398](https://github.com/aws/language-servers/commit/99453989934849eddf1029763c22208cdb13be74))
* **amazonq:** add regionalization support to Telemetry service ([6937c7f](https://github.com/aws/language-servers/commit/6937c7fa53c94f23dab323d0cd92970edafd4452))
* **amazonq:** add support for setting profile to null ([b02906d](https://github.com/aws/language-servers/commit/b02906d04fad42f09e32d44120c4dd32cb2a649c))
* **amazonq:** attach profileArn to API calls when available ([00fe7e2](https://github.com/aws/language-servers/commit/00fe7e2d1327b519042480b8216d663a48dced54))
* **amazonq:** Cancel inflight updateProfile requests ([#861](https://github.com/aws/language-servers/issues/861)) ([a4a4309](https://github.com/aws/language-servers/commit/a4a4309ef1f7c0978aa44a4063d1e8160ad53bb6))
* **amazonq:** centralize access to Q Service SDK instance and add support for Q Developer profiles ([#814](https://github.com/aws/language-servers/issues/814)) ([5f11549](https://github.com/aws/language-servers/commit/5f11549bb37acf3788c991a4ceeb38a7b17f1324))
* **amazonq:** integrate q service manager with configuration server ([#852](https://github.com/aws/language-servers/issues/852)) ([c0e3290](https://github.com/aws/language-servers/commit/c0e32905e5940a79f59b19913aac9f989e85f8fe))
* **amazonq:** intergrate regionalization support into Q Chat server ([#853](https://github.com/aws/language-servers/issues/853)) ([394104c](https://github.com/aws/language-servers/commit/394104c3702055f55ababbbfb056bf7904f5115e))


### Bug Fixes

* **amazonq:** await for recordMetric in CodeDiff tracker ([ee04afc](https://github.com/aws/language-servers/commit/ee04afc7775e83bfa3868b4b661cf59ff3c7f949))
* **amazonq:** handle exceptions in TelemetryService ([e8f6375](https://github.com/aws/language-servers/commit/e8f637524fe878c26c72f506de4abea86b481fde))
* **amazonq:** specify code analysis scope and scan name when running scans ([#858](https://github.com/aws/language-servers/issues/858)) ([a925297](https://github.com/aws/language-servers/commit/a925297aabc89334f4f9eed6c13146f4fd20b164))
* update @aws/language-server-runtimes to 0.2.48 ([e1f620a](https://github.com/aws/language-servers/commit/e1f620ac2b59b4f61daff842a9f29ded1b8fa04e))

## [0.0.28](https://github.com/aws/language-servers/compare/lsp-codewhisperer/v0.0.27...lsp-codewhisperer/v0.0.28) (2025-03-18)


### Features

* **amazonq:** add support for listing available q developer profiles ([40ee2ff](https://github.com/aws/language-servers/commit/40ee2ff254e0cfdeb54fef850bcfb1c45dd898ab))
* **amazonq:** handle client signalling support for q developer profiles ([#839](https://github.com/aws/language-servers/issues/839)) ([8b1b4ad](https://github.com/aws/language-servers/commit/8b1b4ad88138091bacacdaa7abcccaafed85b1ff))
* **amazonq:** stop emitting userDecision telemetry event ([dc51d24](https://github.com/aws/language-servers/commit/dc51d2472390f14490ec175ce94e841f5ee24417))
* **chat-client:** handle 'openTab' requests ([#817](https://github.com/aws/language-servers/issues/817)) ([fdd0b87](https://github.com/aws/language-servers/commit/fdd0b87ad2d2c9a540d2594bb9243cad01b5887a))
* **chat-client:** openTab returns error for tab create if tabs limit hit ([#832](https://github.com/aws/language-servers/issues/832)) ([aa85848](https://github.com/aws/language-servers/commit/aa8584815da1ef6298b83c8d1bb2a1011ed66fe5))
* **identity:** device code support ([#823](https://github.com/aws/language-servers/issues/823)) ([6d5368e](https://github.com/aws/language-servers/commit/6d5368e33a36a3003dc04e9c429b63edda6989de))
* Setting a flag with environment variable to retain generated input artifacts ([#807](https://github.com/aws/language-servers/issues/807)) ([fc9a5b5](https://github.com/aws/language-servers/commit/fc9a5b5fe4e4ae8babbff0bbed28263ae99c1385))


### Bug Fixes

* replace setInterval with recursive setTimeout for browser compatibility ([48b8fd1](https://github.com/aws/language-servers/commit/48b8fd1fd780770cb4b94bb1be33882f204a77e8))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @aws/lsp-core bumped from ^0.0.1 to ^0.0.2

## [0.0.27](https://github.com/aws/language-servers/compare/lsp-codewhisperer/v0.0.26...lsp-codewhisperer/v0.0.27) (2025-02-20)


### Bug Fixes

* fixing model change for skipped step ([#670](https://github.com/aws/language-servers/issues/670)) ([630e6fd](https://github.com/aws/language-servers/commit/630e6fde0b70bb1148e6acdc67c96d40319b6ce7))
* prevent override of client request listeners in CodeWhispererServiceIAM ([#784](https://github.com/aws/language-servers/issues/784)) ([cd85931](https://github.com/aws/language-servers/commit/cd85931f1981921cd5692944fbe1b638124e4457))

## [0.0.26](https://github.com/aws/language-servers/compare/lsp-codewhisperer/v0.0.25...lsp-codewhisperer/v0.0.26) (2025-02-03)


### Bug Fixes

* revert "feat: bugfix for artifacts upload" ([#766](https://github.com/aws/language-servers/issues/766)) ([0c07a17](https://github.com/aws/language-servers/commit/0c07a175218d5deaa2cc4c3cd23641ed8ad0f71e))

## [0.0.25](https://github.com/aws/language-servers/compare/lsp-codewhisperer/v0.0.24...lsp-codewhisperer/v0.0.25) (2025-01-28)


### Bug Fixes

* revert "chore: bump archiver from 6.0.2 to 7.0.1" ([#762](https://github.com/aws/language-servers/issues/762)) ([8d490e5](https://github.com/aws/language-servers/commit/8d490e5022e9ae2dd3ba8514a7dd3dbd1609e290))

## [0.0.24](https://github.com/aws/language-servers/compare/lsp-codewhisperer-v0.0.23...lsp-codewhisperer/v0.0.24) (2025-01-28)


### Features

* bugfix for artifacts upload ([#749](https://github.com/aws/language-servers/issues/749)) ([71c0a19](https://github.com/aws/language-servers/commit/71c0a19974428037160152cc7e40cd6c399ceec9))


### Bug Fixes

* convert makeProxyConfig to sync to allow proxy configs to be loa… ([#725](https://github.com/aws/language-servers/issues/725)) ([7ea8150](https://github.com/aws/language-servers/commit/7ea81505c4c69a0a3ba3b595a51fd40b9db14947))
* make proxy nodejs only ([#716](https://github.com/aws/language-servers/issues/716)) ([37cf726](https://github.com/aws/language-servers/commit/37cf726e4926640da158ee67d86a1937b2c89c68))
* marking aws field as optional in initializationOptions ([#757](https://github.com/aws/language-servers/issues/757)) ([d435c99](https://github.com/aws/language-servers/commit/d435c992c44214523eadfe252bb80d70ffa191f6))
* move CW streaming client to tarball ([#743](https://github.com/aws/language-servers/issues/743)) ([a1a17d8](https://github.com/aws/language-servers/commit/a1a17d853bd1d33897e2deaacec53d6d62bbe2ec))
* removing duplicated nuget packages folder ([#746](https://github.com/aws/language-servers/issues/746)) ([24b44d0](https://github.com/aws/language-servers/commit/24b44d03ce6d2127099a6ce8c33cd63b55fae290))


### Performance Improvements

* dispose chat controller in chatController tests ([#717](https://github.com/aws/language-servers/issues/717)) ([b0e6b78](https://github.com/aws/language-servers/commit/b0e6b78bcee5970eac8159d2a46bae152f1d238d))

## [0.0.23](https://github.com/aws/language-servers/compare/lsp-codewhisperer-v0.0.22...lsp-codewhisperer/v0.0.23) (2025-01-28)


### Features

* bugfix for artifacts upload ([#749](https://github.com/aws/language-servers/issues/749)) ([71c0a19](https://github.com/aws/language-servers/commit/71c0a19974428037160152cc7e40cd6c399ceec9))


### Bug Fixes

* convert makeProxyConfig to sync to allow proxy configs to be loa… ([#725](https://github.com/aws/language-servers/issues/725)) ([7ea8150](https://github.com/aws/language-servers/commit/7ea81505c4c69a0a3ba3b595a51fd40b9db14947))
* make proxy nodejs only ([#716](https://github.com/aws/language-servers/issues/716)) ([37cf726](https://github.com/aws/language-servers/commit/37cf726e4926640da158ee67d86a1937b2c89c68))
* marking aws field as optional in initializationOptions ([#757](https://github.com/aws/language-servers/issues/757)) ([d435c99](https://github.com/aws/language-servers/commit/d435c992c44214523eadfe252bb80d70ffa191f6))
* move CW streaming client to tarball ([#743](https://github.com/aws/language-servers/issues/743)) ([a1a17d8](https://github.com/aws/language-servers/commit/a1a17d853bd1d33897e2deaacec53d6d62bbe2ec))
* removing duplicated nuget packages folder ([#746](https://github.com/aws/language-servers/issues/746)) ([24b44d0](https://github.com/aws/language-servers/commit/24b44d03ce6d2127099a6ce8c33cd63b55fae290))


### Performance Improvements

* dispose chat controller in chatController tests ([#717](https://github.com/aws/language-servers/issues/717)) ([b0e6b78](https://github.com/aws/language-servers/commit/b0e6b78bcee5970eac8159d2a46bae152f1d238d))

## [0.0.22](https://github.com/aws/language-servers/compare/lsp-codewhisperer/v0.0.21...lsp-codewhisperer/v0.0.22) (2025-01-27)


### Bug Fixes

* move CW streaming client to tarball ([#743](https://github.com/aws/language-servers/issues/743)) ([a1a17d8](https://github.com/aws/language-servers/commit/a1a17d853bd1d33897e2deaacec53d6d62bbe2ec))

## [0.0.21](https://github.com/aws/language-servers/compare/lsp-codewhisperer/v0.0.20...lsp-codewhisperer/v0.0.21) (2025-01-16)


### Bug Fixes

* convert makeProxyConfig to sync to allow proxy configs to be loa… ([#725](https://github.com/aws/language-servers/issues/725)) ([7ea8150](https://github.com/aws/language-servers/commit/7ea81505c4c69a0a3ba3b595a51fd40b9db14947))

## [0.0.20](https://github.com/aws/language-servers/compare/lsp-codewhisperer/v0.0.19...lsp-codewhisperer/v0.0.20) (2025-01-15)


### Bug Fixes

* make proxy nodejs only ([#716](https://github.com/aws/language-servers/issues/716)) ([37cf726](https://github.com/aws/language-servers/commit/37cf726e4926640da158ee67d86a1937b2c89c68))


### Performance Improvements

* dispose chat controller in chatController tests ([#717](https://github.com/aws/language-servers/issues/717)) ([b0e6b78](https://github.com/aws/language-servers/commit/b0e6b78bcee5970eac8159d2a46bae152f1d238d))

## [0.0.19](https://github.com/aws/language-servers/compare/lsp-codewhisperer/v0.0.18...lsp-codewhisperer/v0.0.19) (2025-01-08)


### Features

* handle virtual spaces when inserting code to cursor position ([#675](https://github.com/aws/language-servers/issues/675)) ([f2949d4](https://github.com/aws/language-servers/commit/f2949d4f54c5a91b78b02e4d5ff99b8f5c8961b5))
* pass supplemental contexts only for token client ([#697](https://github.com/aws/language-servers/issues/697)) ([7242835](https://github.com/aws/language-servers/commit/72428352db009835b7702977bd50492ab8b79606))


### Bug Fixes

* adding tests for covering the special characters case for auto trigger ([#680](https://github.com/aws/language-servers/issues/680)) ([873fdae](https://github.com/aws/language-servers/commit/873fdae39ad59f7d681b37cfc0b5c2d7062395b9))

## [0.0.18] - 2024-11-20

### Changed

- .NET Transform: Adding status skipped in step and substep of transformation
- .NET Transform: Updated supported types

## [0.0.17] - 2024-11-13

### Added

- .NET Transform: Pass .NET Standard flag to requirement.json
- .NET Transform: add solution file path to requirement.json
- .NET Transform: Add 'netstandard2.0' and 'net9.0' to target framework map
- Amazon Q Telemetry: Emit chat and inline events to destination
- Amazon Q Telemetry: Emit user modification SendTelemetryEvent events for chat and inline completions
- Amazon Q Telemetry: Emit chat add message event
- Logging: Add logging support in case of failures from STE call
- Amazon Q: Make AWS Q endpoint url configurable
- Amazon Q Telemetry: Chat interact with message event integration with SendTelemetryEvent
- Q Inline Completions: Add autotrigger parameters for new languages
- Q Inline Completions: Add support for new languages
- Amazon Q Telemetry: Add makeUserContext utility to create UserContext payload for sendTelemetry event

### Removed

- .NET Transform: Removed optional parameters from the .NET Transform capability to align with a breaking change on the backend
- Amazon Q Chat: Disabled FQN module
- .NET Transform: Trimming logs to not show steps
- .NET Transform: remove webforms from supported projects

### Changed

- Amazon Q Telemetry: Port logic for CodePercentage modifications calculation
- Amazon Q Telemetry: Load proxy configurations in code whisperer base class
- Amazon Q Chat: Migrate to SendMessage streaming endpoint for chat
- Amazon Q Telemetry: Telemetry service with common components encapsulated
- Amazon Q Chat: Handle insertToCursorPosition event in the chat server
- Amazon Q: Update service definition and types for bearer token service client

### Fixed

- Security Scan: Fixed no recursive for the remove
- Amazon Q: fix proxy server configuration
- Amazon Q Telemetry: recalculate connetionType in shouldSendTelemetry event from credentialsProvider at invocation

## [0.0.16] - 2024-10-15

### Added

- Amazon Q Inline Code Completions: The server now supports all languages supported by Q, including `go`, `php`, `rust`, `kotlin`, `terraform`, `ruby`, `shell`, `scala`

### Changed

- Amazon Q Inline Code Completions and Q Chat:  Extend Chat and Completion Telemetry with Customization (#493).
- .Net Transform: Transform result is moved to the artifact location (#495).

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
