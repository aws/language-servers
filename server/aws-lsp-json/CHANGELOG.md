# Changelog

## [0.1.16](https://github.com/aws/language-servers/compare/lsp-json/v0.1.15...lsp-json/v0.1.16) (2025-07-17)


### Bug Fixes

* use document change events for auto trigger classifier input ([#1912](https://github.com/aws/language-servers/issues/1912)) ([2204da6](https://github.com/aws/language-servers/commit/2204da6193f2030ee546f61c969b1a664d8025e3))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @aws/lsp-core bumped from ^0.0.11 to ^0.0.12

## [0.1.15](https://github.com/aws/language-servers/compare/lsp-json/v0.1.14...lsp-json/v0.1.15) (2025-07-02)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @aws/lsp-core bumped from ^0.0.10 to ^0.0.11

## [0.1.14](https://github.com/aws/language-servers/compare/lsp-json/v0.1.13...lsp-json/v0.1.14) (2025-06-26)


### Features

* add client side ide diagnostics to telemetry event ([#1768](https://github.com/aws/language-servers/issues/1768)) ([d08fc6c](https://github.com/aws/language-servers/commit/d08fc6cccb9238cef9c2ba485e116c0516839537))

## [0.1.13](https://github.com/aws/language-servers/compare/lsp-json/v0.1.12...lsp-json/v0.1.13) (2025-06-23)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @aws/lsp-core bumped from ^0.0.9 to ^0.0.10

## [0.1.12](https://github.com/aws/language-servers/compare/lsp-json/v0.1.11...lsp-json/v0.1.12) (2025-06-16)


### Features

* **amazonq:** pinned context and rules ([#1663](https://github.com/aws/language-servers/issues/1663)) ([25e7a5a](https://github.com/aws/language-servers/commit/25e7a5ab8b6630525a4fd6acc0524f67f00af817))

## [0.1.11](https://github.com/aws/language-servers/compare/lsp-json/v0.1.10...lsp-json/v0.1.11) (2025-06-10)


### Features

* add C8 test coverage support ([#1567](https://github.com/aws/language-servers/issues/1567)) ([eee5048](https://github.com/aws/language-servers/commit/eee5048c783ffc300073865d391372d5a583365c))
* adding mcp servers feature to the language-server ([#1544](https://github.com/aws/language-servers/issues/1544)) ([f37bf5f](https://github.com/aws/language-servers/commit/f37bf5f91921d7611c124de6d54dd6ec653038c6))

## [0.1.10](https://github.com/aws/language-servers/compare/lsp-json/v0.1.9...lsp-json/v0.1.10) (2025-05-30)


### Bug Fixes

* ensure local index server updates with workspaceChangeEvent and bump runtimes ([#1424](https://github.com/aws/language-servers/issues/1424)) ([9babbb6](https://github.com/aws/language-servers/commit/9babbb643daa2893454dbc977d3802822b2c0aa6))

## [0.1.9](https://github.com/aws/language-servers/compare/lsp-json/v0.1.8...lsp-json/v0.1.9) (2025-05-22)


### Bug Fixes

* **amazonq:** Use common utility to determine workspaceFolders and fix tests ([#1353](https://github.com/aws/language-servers/issues/1353)) ([483f532](https://github.com/aws/language-servers/commit/483f532b940d3ff2e914c0824f7501c3fe6a6235))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @aws/lsp-core bumped from ^0.0.8 to ^0.0.9

## [0.1.8](https://github.com/aws/language-servers/compare/lsp-json/v0.1.7...lsp-json/v0.1.8) (2025-05-14)


### Bug Fixes

* bump runtimes and fix broken test ([#1323](https://github.com/aws/language-servers/issues/1323)) ([7d1a7b9](https://github.com/aws/language-servers/commit/7d1a7b9700ee2cc154dfe357ebbb62597d3f1582))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @aws/lsp-core bumped from ^0.0.7 to ^0.0.8

## [0.1.7](https://github.com/aws/language-servers/compare/lsp-json/v0.1.6...lsp-json/v0.1.7) (2025-05-09)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @aws/lsp-core bumped from ^0.0.6 to ^0.0.7

## [0.1.6](https://github.com/aws/language-servers/compare/lsp-json/v0.1.5...lsp-json/v0.1.6) (2025-05-07)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @aws/lsp-core bumped from ^0.0.5 to ^0.0.6

## [0.1.5](https://github.com/aws/language-servers/compare/lsp-json/v0.1.4...lsp-json/v0.1.5) (2025-05-06)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @aws/lsp-core bumped from ^0.0.4 to ^0.0.5

## [0.1.4](https://github.com/aws/language-servers/compare/lsp-json/v0.1.3...lsp-json/v0.1.4) (2025-05-01)


### Features

* workspace open settings ([#1055](https://github.com/aws/language-servers/issues/1055)) ([f3018da](https://github.com/aws/language-servers/commit/f3018da706663b0f64bc5b4becc2fd600d5ff5b6))


### Bug Fixes

* onFileClick logic is crashing the whole process if no workspace is open ([#1119](https://github.com/aws/language-servers/issues/1119)) ([0211223](https://github.com/aws/language-servers/commit/0211223a93dd3ddcb5b7b06882e2a10eb09fa01c))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @aws/lsp-core bumped from ^0.0.3 to ^0.0.4

## [0.1.3](https://github.com/aws/language-servers/compare/lsp-json/v0.1.2...lsp-json/v0.1.3) (2025-04-07)


### Features

* context data selection support in chat-client ([#902](https://github.com/aws/language-servers/issues/902)) ([a22dea5](https://github.com/aws/language-servers/commit/a22dea51c0039f198a403e88f774ad7769b15d29))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @aws/lsp-core bumped from ^0.0.2 to ^0.0.3

## [0.1.2](https://github.com/aws/language-servers/compare/lsp-json/v0.1.1...lsp-json/v0.1.2) (2025-03-26)


### Bug Fixes

* update @aws/language-server-runtimes to 0.2.83 ([e1f620a](https://github.com/aws/language-servers/commit/e1f620ac2b59b4f61daff842a9f29ded1b8fa04e))

## [0.1.1](https://github.com/aws/language-servers/compare/lsp-json/v0.1.0...lsp-json/v0.1.1) (2025-03-18)


### Features

* **chat-client:** handle 'openTab' requests ([#817](https://github.com/aws/language-servers/issues/817)) ([fdd0b87](https://github.com/aws/language-servers/commit/fdd0b87ad2d2c9a540d2594bb9243cad01b5887a))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @aws/lsp-core bumped from ^0.0.1 to ^0.0.2

[0.0.1] - 2024-06-07

- Intial release of the JSON LSP Server
[0.1.0] - 2024-08-27

- Updates to include customizable LSP Service
