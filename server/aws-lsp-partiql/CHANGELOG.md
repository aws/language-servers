# Changelog

## [0.0.16](https://github.com/aws/language-servers/compare/lsp-partiql/v0.0.15...lsp-partiql/v0.0.16) (2025-08-04)


### Bug Fixes

* use new language server runtime ([#2023](https://github.com/aws/language-servers/issues/2023)) ([83ea1e4](https://github.com/aws/language-servers/commit/83ea1e42fe52990696eb9b878fa11e2c5331bec5))

## [0.0.15](https://github.com/aws/language-servers/compare/lsp-partiql/v0.0.14...lsp-partiql/v0.0.15) (2025-07-17)


### Bug Fixes

* use document change events for auto trigger classifier input ([#1912](https://github.com/aws/language-servers/issues/1912)) ([2204da6](https://github.com/aws/language-servers/commit/2204da6193f2030ee546f61c969b1a664d8025e3))

## [0.0.14](https://github.com/aws/language-servers/compare/lsp-partiql/v0.0.13...lsp-partiql/v0.0.14) (2025-06-26)


### Features

* add client side ide diagnostics to telemetry event ([#1768](https://github.com/aws/language-servers/issues/1768)) ([d08fc6c](https://github.com/aws/language-servers/commit/d08fc6cccb9238cef9c2ba485e116c0516839537))

## [0.0.13](https://github.com/aws/language-servers/compare/lsp-partiql/v0.0.12...lsp-partiql/v0.0.13) (2025-06-16)


### Features

* **amazonq:** pinned context and rules ([#1663](https://github.com/aws/language-servers/issues/1663)) ([25e7a5a](https://github.com/aws/language-servers/commit/25e7a5ab8b6630525a4fd6acc0524f67f00af817))

## [0.0.12](https://github.com/aws/language-servers/compare/lsp-partiql/v0.0.11...lsp-partiql/v0.0.12) (2025-06-10)


### Features

* adding mcp servers feature to the language-server ([#1544](https://github.com/aws/language-servers/issues/1544)) ([f37bf5f](https://github.com/aws/language-servers/commit/f37bf5f91921d7611c124de6d54dd6ec653038c6))

## [0.0.11](https://github.com/aws/language-servers/compare/lsp-partiql/v0.0.10...lsp-partiql/v0.0.11) (2025-05-30)


### Bug Fixes

* ensure local index server updates with workspaceChangeEvent and bump runtimes ([#1424](https://github.com/aws/language-servers/issues/1424)) ([9babbb6](https://github.com/aws/language-servers/commit/9babbb643daa2893454dbc977d3802822b2c0aa6))

## [0.0.10](https://github.com/aws/language-servers/compare/lsp-partiql/v0.0.9...lsp-partiql/v0.0.10) (2025-05-22)


### Bug Fixes

* **amazonq:** Use common utility to determine workspaceFolders and fix tests ([#1353](https://github.com/aws/language-servers/issues/1353)) ([483f532](https://github.com/aws/language-servers/commit/483f532b940d3ff2e914c0824f7501c3fe6a6235))

## [0.0.9](https://github.com/aws/language-servers/compare/lsp-partiql/v0.0.8...lsp-partiql/v0.0.9) (2025-05-14)


### Bug Fixes

* bump runtimes and fix broken test ([#1323](https://github.com/aws/language-servers/issues/1323)) ([7d1a7b9](https://github.com/aws/language-servers/commit/7d1a7b9700ee2cc154dfe357ebbb62597d3f1582))

## [0.0.8](https://github.com/aws/language-servers/compare/lsp-partiql/v0.0.7...lsp-partiql/v0.0.8) (2025-05-01)


### Features

* workspace open settings ([#1055](https://github.com/aws/language-servers/issues/1055)) ([f3018da](https://github.com/aws/language-servers/commit/f3018da706663b0f64bc5b4becc2fd600d5ff5b6))


### Bug Fixes

* onFileClick logic is crashing the whole process if no workspace is open ([#1119](https://github.com/aws/language-servers/issues/1119)) ([0211223](https://github.com/aws/language-servers/commit/0211223a93dd3ddcb5b7b06882e2a10eb09fa01c))

## [0.0.7](https://github.com/aws/language-servers/compare/lsp-partiql/v0.0.6...lsp-partiql/v0.0.7) (2025-04-07)


### Features

* context data selection support in chat-client ([#902](https://github.com/aws/language-servers/issues/902)) ([a22dea5](https://github.com/aws/language-servers/commit/a22dea51c0039f198a403e88f774ad7769b15d29))

## [0.0.6](https://github.com/aws/language-servers/compare/lsp-partiql/v0.0.5...lsp-partiql/v0.0.6) (2025-03-26)


### Bug Fixes

* update @aws/language-server-runtimes to 0.2.83 ([e1f620a](https://github.com/aws/language-servers/commit/e1f620ac2b59b4f61daff842a9f29ded1b8fa04e))

## [0.0.5](https://github.com/aws/language-servers/compare/lsp-partiql/v0.0.4...lsp-partiql/v0.0.5) (2025-03-18)


### Features

* **chat-client:** handle 'openTab' requests ([#817](https://github.com/aws/language-servers/issues/817)) ([fdd0b87](https://github.com/aws/language-servers/commit/fdd0b87ad2d2c9a540d2594bb9243cad01b5887a))

## [0.0.4] - 2024-09-03
- Features: add PRIMARY KEY and table options support PartiQL server grammar

## [0.0.3] - 2024-07-31
- Features: Add syntax-highlighting, keywords hovering, function signature help and auto-completion support to this server

## [0.0.2] - 2024-06-18
- Fix: don't report diagnostics for quoted identifiers

## [0.0.1] - 2024-05-31
- Initial release of PArtiQL Language Server implementation
