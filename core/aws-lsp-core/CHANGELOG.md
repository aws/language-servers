# Changelog

## [0.0.4](https://github.com/aws/language-servers/compare/lsp-core/v0.0.3...lsp-core/v0.0.4) (2025-05-01)


### Features

* add cancellation handling to tools ([#1057](https://github.com/aws/language-servers/issues/1057)) ([f2ea9ac](https://github.com/aws/language-servers/commit/f2ea9ac349dbd2825ca8e6934f44c1270653dc61))
* extend logging utilts to support errors ([03c5bdd](https://github.com/aws/language-servers/commit/03c5bdd7f9861a222c21ce4a6594d1cc7b39d217))
* port executeBash tool from VSC ([#912](https://github.com/aws/language-servers/issues/912)) ([1ccba58](https://github.com/aws/language-servers/commit/1ccba58a9e339ab7d5e4370cf40fa7268f802fd8))
* port listDirectory from VSC ([#930](https://github.com/aws/language-servers/issues/930)) ([7feb127](https://github.com/aws/language-servers/commit/7feb127f33570d2349852781e16cc9d6763a92b8))
* port readDirectoryRecursively from VSC ([#923](https://github.com/aws/language-servers/issues/923)) ([af48204](https://github.com/aws/language-servers/commit/af48204201fbe531d9d5185b927936e8adbb695f))


### Bug Fixes

* add workspace folders as context for agentic-chat ([#995](https://github.com/aws/language-servers/issues/995)) ([f300ca5](https://github.com/aws/language-servers/commit/f300ca5acae03a993114c31d0b88d88b6cd26dc4))
* disable timeout for tests in aws-lsp-codewhisperer and core packages ([#955](https://github.com/aws/language-servers/issues/955)) ([254e36c](https://github.com/aws/language-servers/commit/254e36cf1a34b114a9397c688784293367dc1d63))
* format objects in the logs properly. ([#1139](https://github.com/aws/language-servers/issues/1139)) ([1ff522c](https://github.com/aws/language-servers/commit/1ff522c7005bae518cf8ae3ed80a0faa82d11435))
* isInWorkspace should work on closed files.  ([#1004](https://github.com/aws/language-servers/issues/1004)) ([a96651e](https://github.com/aws/language-servers/commit/a96651ea1edd296b5dfa7ee4fdd1c6d378a14858))
* stop button kills the shell executions ([1ff522c](https://github.com/aws/language-servers/commit/1ff522c7005bae518cf8ae3ed80a0faa82d11435))

## [0.0.3](https://github.com/aws/language-servers/compare/lsp-core/v0.0.2...lsp-core/v0.0.3) (2025-04-07)


### Features

* port fs related tools from VSC.  ([#894](https://github.com/aws/language-servers/issues/894)) ([a368acc](https://github.com/aws/language-servers/commit/a368accfcd0b5c88b81f407d4cd7b73be2782b9b))

## [0.0.2](https://github.com/aws/language-servers/compare/lsp-core/v0.0.1...lsp-core/v0.0.2) (2025-03-18)


### Features

* **identity:** device code support ([#823](https://github.com/aws/language-servers/issues/823)) ([6d5368e](https://github.com/aws/language-servers/commit/6d5368e33a36a3003dc04e9c429b63edda6989de))

[0.0.1] - 2024-06-07

- Intial release containing helper classes and functions that are used in `@aws/lsp-yaml`, `@aws/lsp-json` and other packages
