# Changelog

## [0.1.5](https://github.com/aws/language-servers/compare/chat-client/v0.1.4...chat-client/v0.1.5) (2025-04-25)


### Features

* add [@workspace](https://github.com/workspace) context in agentic chat ([#1029](https://github.com/aws/language-servers/issues/1029)) ([f2916f4](https://github.com/aws/language-servers/commit/f2916f45c351a42a9951ff00bcb7f7eed3ce7274))
* add explanation text as directive ([#1054](https://github.com/aws/language-servers/issues/1054)) ([a0ca8e0](https://github.com/aws/language-servers/commit/a0ca8e0059a26ac7f21e04940ad120c3de268df9))
* add header and buttons to chat response ([#1020](https://github.com/aws/language-servers/issues/1020)) ([ada6c7f](https://github.com/aws/language-servers/commit/ada6c7fd36dc9f64f093d7629e957d23e322848d))
* add pair programming card ([#1023](https://github.com/aws/language-servers/issues/1023)) ([59cf153](https://github.com/aws/language-servers/commit/59cf15385c320e6644b04548e1eb61a68ca784de))
* add the grepSearch tool ([#1109](https://github.com/aws/language-servers/issues/1109)) ([6016264](https://github.com/aws/language-servers/commit/601626428b6ac968fe85257a09478e94263a5a1e))
* added support for injecting additional context commands ([#1045](https://github.com/aws/language-servers/issues/1045)) ([d755da3](https://github.com/aws/language-servers/commit/d755da36bd7bf76684aceafb6a2cbc2f8f76291e))
* **amazonq:** add pair programming toggle ([#1013](https://github.com/aws/language-servers/issues/1013)) ([7266d32](https://github.com/aws/language-servers/commit/7266d32b2fb73ead40abecb22749a2c9e5206a2a))
* **amazonq:** initial implementation of read/list chat result ([#1024](https://github.com/aws/language-servers/issues/1024)) ([890e45e](https://github.com/aws/language-servers/commit/890e45eae48930370089936880c77b10edb83059))
* **amazonq:** initial UI for execute bash chat message ([#1041](https://github.com/aws/language-servers/issues/1041)) ([b3ed518](https://github.com/aws/language-servers/commit/b3ed518f27251742c392138f05b02281dfcddcac))
* **chat-client:** handle chat updates for existing messages ([#1048](https://github.com/aws/language-servers/issues/1048)) ([74abb12](https://github.com/aws/language-servers/commit/74abb126a736e3c37beb492bc7405b02c953296c))
* **chat-client:** history list and conversation actions ([#929](https://github.com/aws/language-servers/issues/929)) ([5b8e83c](https://github.com/aws/language-servers/commit/5b8e83cacc56d854623a6e2b59f2f920538f5b85))
* **chat-client:** implement export conversation flow ([#944](https://github.com/aws/language-servers/issues/944)) ([63fd2dc](https://github.com/aws/language-servers/commit/63fd2dc773e742c47040fd66aac4912664d91dd0))
* **chat-client:** open use input prompt for agentic chat and new prompt should st… ([#1081](https://github.com/aws/language-servers/issues/1081)) ([ca1a01d](https://github.com/aws/language-servers/commit/ca1a01dd0487e13f91c36f5288dc1b3b0232c682))
* configure history button based on history enabled/disabled ([#957](https://github.com/aws/language-servers/issues/957)) ([eded88f](https://github.com/aws/language-servers/commit/eded88fae2311c2a73d377a479933f9f66df137d))
* handle fileClick events ([#919](https://github.com/aws/language-servers/issues/919)) ([511be2e](https://github.com/aws/language-servers/commit/511be2e2e6f527039a99f53cb76fbfc180ef9b55))
* implement restore tab ([#933](https://github.com/aws/language-servers/issues/933)) ([ad2c5d7](https://github.com/aws/language-servers/commit/ad2c5d77e497e9f8a2019eb547b164f5c5992160))
* initial fsWrite chat message ([#1026](https://github.com/aws/language-servers/issues/1026)) ([3fc6e85](https://github.com/aws/language-servers/commit/3fc6e85e14614a86982b9fb85317c923784a05af))
* open use input prompt for agentic chat and new prompt should stop current response ([ca1a01d](https://github.com/aws/language-servers/commit/ca1a01dd0487e13f91c36f5288dc1b3b0232c682))
* render additional chat messages ([#1025](https://github.com/aws/language-servers/issues/1025)) ([3a87baa](https://github.com/aws/language-servers/commit/3a87baa96cacba40f3fa920e4a02d26aa01a7058))
* route button event through chat-client.  ([#1037](https://github.com/aws/language-servers/issues/1037)) ([c6bb6c5](https://github.com/aws/language-servers/commit/c6bb6c5e81f0c639657e36e1989f6bae3ef47f38))
* support view diff for fsWrite ([#1042](https://github.com/aws/language-servers/issues/1042)) ([98291cb](https://github.com/aws/language-servers/commit/98291cb62a43176ec176bcdd92aa7746d08b9740))
* update confirm header after button click WIP ([#1062](https://github.com/aws/language-servers/issues/1062)) ([f396bd6](https://github.com/aws/language-servers/commit/f396bd658df4200b595cd62687d2ed19ef68ec58))
* workspace open settings ([#1055](https://github.com/aws/language-servers/issues/1055)) ([f3018da](https://github.com/aws/language-servers/commit/f3018da706663b0f64bc5b4becc2fd600d5ff5b6))


### Bug Fixes

* **amazonq:** add validation for create a saved prompt UX ([#1116](https://github.com/aws/language-servers/issues/1116)) ([a72d4d2](https://github.com/aws/language-servers/commit/a72d4d2cf2df883ae3c4b143b65d1373433a4b58))
* **amazonq:** bundle dependencies ([4a128e7](https://github.com/aws/language-servers/commit/4a128e78b275d13af13e9c9f059da01b892fb017))
* **amazonq:** hide stop generating button in hybrid chat ([#1006](https://github.com/aws/language-servers/issues/1006)) ([c2b7c25](https://github.com/aws/language-servers/commit/c2b7c2549ead850a7c568a64830b2f151bee005a))
* **amazonq:** include mynah ui ([b1dae1b](https://github.com/aws/language-servers/commit/b1dae1b85e58dcedc7f102d2643f345c6cade135))
* **amazonq:** reference local path ([a43366d](https://github.com/aws/language-servers/commit/a43366d62df5bf9c173f633c08b666d9492ea19d))
* **chat-client:** disable click event for empty history list item ([#973](https://github.com/aws/language-servers/issues/973)) ([bc20a04](https://github.com/aws/language-servers/commit/bc20a04277a7b603e0d0c5e623c87b2a5c4dc4d4))
* **chat-client:** do not route onTabBarButtonClick to custom handler ([08a5a5b](https://github.com/aws/language-servers/commit/08a5a5b76432aa370ef2ae3fc2ac70f922458c36))
* **chat-client:** fix the warning icon ([#1126](https://github.com/aws/language-servers/issues/1126)) ([c3ecda6](https://github.com/aws/language-servers/commit/c3ecda6317d2b78bac03d2fb4b3b6b011763cd00))
* **chat-client:** missing break in getSerializedChat request handling ([#978](https://github.com/aws/language-servers/issues/978)) ([5555d09](https://github.com/aws/language-servers/commit/5555d09f2c024621ae706e01a8cac70f5582a7d8))
* **chat-client:** string change ([#1118](https://github.com/aws/language-servers/issues/1118)) ([f21700a](https://github.com/aws/language-servers/commit/f21700a6b8573838a3e28e4e087f6864550fa9f2))
* convert switch to checkbox for PPM mode ([#1099](https://github.com/aws/language-servers/issues/1099)) ([15c171f](https://github.com/aws/language-servers/commit/15c171f701587de992c14762d9de9698f6846ee6))
* execute command should show when no approval required & add more loading ([#1091](https://github.com/aws/language-servers/issues/1091)) ([5c48989](https://github.com/aws/language-servers/commit/5c48989d18665b84578b9c4bc49a5f3928754619))
* export for answer-stream card item ([#1019](https://github.com/aws/language-servers/issues/1019)) ([c367ef3](https://github.com/aws/language-servers/commit/c367ef3a1374032dace0e6755eaa43a1fae6e3c4))
* further improvements for thinking/loading ([#1125](https://github.com/aws/language-servers/issues/1125)) ([5e091d7](https://github.com/aws/language-servers/commit/5e091d704cbd3dd4cd3a2a97f0234f029cc49247))
* highlight command mistype ([#1060](https://github.com/aws/language-servers/issues/1060)) ([69742be](https://github.com/aws/language-servers/commit/69742be4348f04f5c683be4dfaa499a7700e99f5))
* improve chat rendering if there are additional chat messages ([#1039](https://github.com/aws/language-servers/issues/1039)) ([70a086a](https://github.com/aws/language-servers/commit/70a086a823fc56dcd068dee0fa3147cb06684b9a))
* incorrect props for fsWrite message ([#1043](https://github.com/aws/language-servers/issues/1043)) ([03deddf](https://github.com/aws/language-servers/commit/03deddf0f756629e7459a71236e408c0ef3e9727))
* onFileClick logic is crashing the whole process if no workspace is open ([#1119](https://github.com/aws/language-servers/issues/1119)) ([0211223](https://github.com/aws/language-servers/commit/0211223a93dd3ddcb5b7b06882e2a10eb09fa01c))
* remove duplicate property ([#928](https://github.com/aws/language-servers/issues/928)) ([c1aaec0](https://github.com/aws/language-servers/commit/c1aaec06b70f4ef9d5e2a7ad0d1cc4d5d6955087))
* remove examples from welcome message ([#1040](https://github.com/aws/language-servers/issues/1040)) ([82138b3](https://github.com/aws/language-servers/commit/82138b37288ac7dc142b5a9f4ee1e5e70b5ef34a))
* remove loading when stop clicked and add loading when request in progress ([#1117](https://github.com/aws/language-servers/issues/1117)) ([40098dd](https://github.com/aws/language-servers/commit/40098ddc0277a1f29339b15d0950917143d2178b))
* remove undefined header from followup authenticate button ([#1085](https://github.com/aws/language-servers/issues/1085)) ([1502bb9](https://github.com/aws/language-servers/commit/1502bb922117db8fc9f1cfd74db092be5fbba13b))
* remvoe code block insert-to-cursor in pp mode ([#1092](https://github.com/aws/language-servers/issues/1092)) ([6d12f3e](https://github.com/aws/language-servers/commit/6d12f3e4b0c78614786228b63cf6bbf34588ca1c))
* replaced icon for history and added tests ([#951](https://github.com/aws/language-servers/issues/951)) ([da3b664](https://github.com/aws/language-servers/commit/da3b66414514740f514d96279b826aebc4e86077))
* save ([#1035](https://github.com/aws/language-servers/issues/1035)) ([d115563](https://github.com/aws/language-servers/commit/d115563b96c41ae571fdf0d0525776ce83de9026))
* spinner text should now say Thinking... ([#1058](https://github.com/aws/language-servers/issues/1058)) ([0bd7f38](https://github.com/aws/language-servers/commit/0bd7f38ddce4ca0919a2573bfca1fe0888677bda))
* tool cards have the wrong props ([#1084](https://github.com/aws/language-servers/issues/1084)) ([697dd18](https://github.com/aws/language-servers/commit/697dd18a5da3e0f6fec9d094a9b1170e94ed3f3b))
* update placeholder ghost message ([#1093](https://github.com/aws/language-servers/issues/1093)) ([0d2c76e](https://github.com/aws/language-servers/commit/0d2c76e8f681671c57d7cc4fe574c855dad19e93))
* update pp mode in tab store ([#1128](https://github.com/aws/language-servers/issues/1128)) ([7c5e5a8](https://github.com/aws/language-servers/commit/7c5e5a82437c532a304ec9ab04971f2b9c85f0ad))

## [0.1.4](https://github.com/aws/language-servers/compare/chat-client/v0.1.3...chat-client/v0.1.4) (2025-04-08)


### Features

* **chat-client:** added support for redirecting message handling to custom adapter ([#905](https://github.com/aws/language-servers/issues/905)) ([b95fe1e](https://github.com/aws/language-servers/commit/b95fe1e1a63f6df469bcd0c5e58a66c0819feb55))


### Bug Fixes

* pin typescript version and fix compile errors ([#924](https://github.com/aws/language-servers/issues/924)) ([7400fa3](https://github.com/aws/language-servers/commit/7400fa3d143fb2c22575485eec7aeb75a63b3612))

## [0.1.3](https://github.com/aws/language-servers/compare/chat-client/v0.1.2...chat-client/v0.1.3) (2025-04-07)

### Features

- add context transparency feature ([#903](https://github.com/aws/language-servers/issues/903)) ([9432ffb](https://github.com/aws/language-servers/commit/9432ffb8586e4f8181c4f14944b0d3d32aff3e78))
- context data selection support in chat-client ([#902](https://github.com/aws/language-servers/issues/902)) ([a22dea5](https://github.com/aws/language-servers/commit/a22dea51c0039f198a403e88f774ad7769b15d29))
- support create prompt form in chat-client ([#910](https://github.com/aws/language-servers/issues/910)) ([a1f0310](https://github.com/aws/language-servers/commit/a1f0310eff33700cff9551c7d3c84356e4246856))

## [0.1.2](https://github.com/aws/language-servers/compare/chat-client/v0.1.1...chat-client/v0.1.2) (2025-03-18)

### Features

- **chat-client:** handle 'openTab' requests ([#817](https://github.com/aws/language-servers/issues/817)) ([fdd0b87](https://github.com/aws/language-servers/commit/fdd0b87ad2d2c9a540d2594bb9243cad01b5887a))
- **chat-client:** openTab returns error for tab create if tabs limit hit ([#832](https://github.com/aws/language-servers/issues/832)) ([aa85848](https://github.com/aws/language-servers/commit/aa8584815da1ef6298b83c8d1bb2a1011ed66fe5))

### Bug Fixes

- bump mynah-ui version ([#843](https://github.com/aws/language-servers/issues/843)) ([4b4de1e](https://github.com/aws/language-servers/commit/4b4de1e01143521e5f497ae5780551dd60e0a4fd))

## [0.1.1](https://github.com/aws/language-servers/compare/chat-client/v0.1.0...chat-client/v0.1.1) (2025-02-20)

### Changed

- update mynah-ui to v4.22.1 ([#794](https://github.com/aws/language-servers/issues/794)) ([5630ed3](https://github.com/aws/language-servers/commit/5630ed33005291194e2f9391ec20647b37fa4626))

## [0.1.0](https://github.com/aws/language-servers/compare/chat-client/v0.0.9...chat-client/v0.1.0) (2025-01-08)

### ⚠ BREAKING CHANGES

- **chat-client:** trigger release of new major version ([#713](https://github.com/aws/language-servers/issues/713))

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
