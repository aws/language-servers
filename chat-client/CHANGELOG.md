# Changelog

## [0.1.3](https://github.com/aws/language-servers/compare/chat-client/v0.1.2...chat-client/v0.1.3) (2025-04-07)


### Features

* add context transparency feature ([#903](https://github.com/aws/language-servers/issues/903)) ([9432ffb](https://github.com/aws/language-servers/commit/9432ffb8586e4f8181c4f14944b0d3d32aff3e78))
* context data selection support in chat-client ([#902](https://github.com/aws/language-servers/issues/902)) ([a22dea5](https://github.com/aws/language-servers/commit/a22dea51c0039f198a403e88f774ad7769b15d29))
* support create prompt form in chat-client ([#910](https://github.com/aws/language-servers/issues/910)) ([a1f0310](https://github.com/aws/language-servers/commit/a1f0310eff33700cff9551c7d3c84356e4246856))

## [0.1.2](https://github.com/aws/language-servers/compare/chat-client/v0.1.1...chat-client/v0.1.2) (2025-03-18)


### Features

* **chat-client:** handle 'openTab' requests ([#817](https://github.com/aws/language-servers/issues/817)) ([fdd0b87](https://github.com/aws/language-servers/commit/fdd0b87ad2d2c9a540d2594bb9243cad01b5887a))
* **chat-client:** openTab returns error for tab create if tabs limit hit ([#832](https://github.com/aws/language-servers/issues/832)) ([aa85848](https://github.com/aws/language-servers/commit/aa8584815da1ef6298b83c8d1bb2a1011ed66fe5))


### Bug Fixes

* bump mynah-ui version ([#843](https://github.com/aws/language-servers/issues/843)) ([4b4de1e](https://github.com/aws/language-servers/commit/4b4de1e01143521e5f497ae5780551dd60e0a4fd))

## [0.1.1](https://github.com/aws/language-servers/compare/chat-client/v0.1.0...chat-client/v0.1.1) (2025-02-20)


### Changed

* update mynah-ui to v4.22.1 ([#794](https://github.com/aws/language-servers/issues/794)) ([5630ed3](https://github.com/aws/language-servers/commit/5630ed33005291194e2f9391ec20647b37fa4626))

## [0.1.0](https://github.com/aws/language-servers/compare/chat-client/v0.0.9...chat-client/v0.1.0) (2025-01-08)


### ⚠ BREAKING CHANGES

* **chat-client:** trigger release of new major version ([#713](https://github.com/aws/language-servers/issues/713))

### Added

- Add new `DISCLAIMER_ACKNOWLEDGED` event to the chat client
- Add new `disclaimerAcknowledged?: boolean` flag to the config
- Add an acknowledgeable legal disclaimer to every tab based on the `disclaimerAcknowledged` flag

### Changed

- Update `@aws/chat-client-ui-types` to 0.1.0
- Update `@aws/language-server-runtimes-types` to 0.1.0
- Shortened legal text in the footer

## [0.0.9] - 2024-11-20

### Changed

- Updated dependency: `@aws/mynah-ui` from 4.16.0 to 4.18.1.

## [0.0.8] - 2024-11-13

### Changed

- Reverted dependency: `@aws/mynah-ui` from 4.18.0 to 4.16.0.

## [0.0.7] - 2024-11-08

### Added

- Add new `COPY_TO_CLIPBOARD` event to the chat client 

### Changed

- Changed legal text in the footer
- Update `@aws/chat-client-ui-types` to 0.0.8
- Update `@aws/language-server-runtimes-types` to to 0.0.7
- Upgraded dependency: `@aws/mynah-ui` from 4.15.11 to 4.18.0:
    - Inline code elements now wrap onto new lines 
    - Send button no longer shifts out of the window when horizontally filling the prompt input without spaces (now it wraps)
    - Footer text now wraps instead of overflowing when it's too large for the chat window 
    - Centered the text in the footer 
    - Character counter now only shows starting from a threshold
    - Code blocks now wrap instead of scroll on screens narrower than 300px 
    - Added gradient border on prompt input focus
    - Fixed issue where unexpected anchor tags were being generated inside code blocks if there was a link inside the code block
    - Updated link (anchor) colors inside card body to improve visibility on several themes
    - Scrollbar styling, now more subtle on darker themes 
    - Fixed `<span>` tags not being closed in (inline) code blocks
    - Fixed file tree item's action icons shrinking when title is too long 

## [0.0.6] - 2024-10-10

### Fixed

- Export built chat client app in `./build` directory

## [0.0.4] - 2024-10-09

### Fixed

- Better handle `undefined` quickActionCommands
- Handle application focus through mynah-ui instead of through the window object

### Changed

- Upgraded dependency: `@aws/mynah-ui` 4.15.11
