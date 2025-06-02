# Changelog

## [0.1.13](https://github.com/aws/language-servers/compare/chat-client/v0.1.12...chat-client/v0.1.13) (2025-06-02)


### Features

* model selection for agentic chat ([#1294](https://github.com/aws/language-servers/issues/1294)) ([10abd04](https://github.com/aws/language-servers/commit/10abd041d340b1b6fe6adad81cc1f6bd1610826e))

## [0.1.12](https://github.com/aws/language-servers/compare/chat-client/v0.1.11...chat-client/v0.1.12) (2025-05-30)


### Bug Fixes

* **chat-client:** fix bug where pair programmer mode option update was not stored properly ([#1400](https://github.com/aws/language-servers/issues/1400)) ([bcdd9a2](https://github.com/aws/language-servers/commit/bcdd9a2b02a1e37aa83ac93ceef93d84a99951de))
* remove gradient from create prompt button ([#1475](https://github.com/aws/language-servers/issues/1475)) ([2f34d43](https://github.com/aws/language-servers/commit/2f34d438b08ced84c0a17303fd22d7f750c64dfd))

## [0.1.11](https://github.com/aws/language-servers/compare/chat-client/v0.1.10...chat-client/v0.1.11) (2025-05-22)


### Bug Fixes

* Revert stop text align ([#1397](https://github.com/aws/language-servers/issues/1397)) ([439e859](https://github.com/aws/language-servers/commit/439e8597b5ce8ad052ab571a1a156044f8862206))
* Stop text align ([#1321](https://github.com/aws/language-servers/issues/1321)) ([0f522a1](https://github.com/aws/language-servers/commit/0f522a17004174d29955bf70c304ad9ca39df623))

## [0.1.10](https://github.com/aws/language-servers/compare/chat-client/v0.1.9...chat-client/v0.1.10) (2025-05-14)


### Features

* **amazonq:** telemetry for chat history and export ([#1314](https://github.com/aws/language-servers/issues/1314)) ([aaa08a4](https://github.com/aws/language-servers/commit/aaa08a4f29ac34f85ec9badf975d6e2e8d114627))


### Bug Fixes

* **amazonq:** 500k max input limit in user input box. Align payload prompt with user typed prompt. ([#1325](https://github.com/aws/language-servers/issues/1325)) ([3338cc1](https://github.com/aws/language-servers/commit/3338cc1b5dcfd375385d7db2fa693870687dba8a))
* open initial tab using mynahUI defaults instead of waiting for ChatOptions ([#1322](https://github.com/aws/language-servers/issues/1322)) ([87178a5](https://github.com/aws/language-servers/commit/87178a554f23decb45fbdf26f067d0d9801f91a0))
* remove @ mention in placeholder q chat text if agentic mode not available ([#1311](https://github.com/aws/language-servers/issues/1311)) ([28f84fc](https://github.com/aws/language-servers/commit/28f84fc82fd5e55ec1cdc61d1bcca6e4e447b12f))
* stop buttom work expected ([#1307](https://github.com/aws/language-servers/issues/1307)) ([06c752e](https://github.com/aws/language-servers/commit/06c752e1dee106be73daa73f336213aad5413e67))
* welcome card shows everytime ([#1332](https://github.com/aws/language-servers/issues/1332)) ([e030bdd](https://github.com/aws/language-servers/commit/e030bdd2f0daf61c062f64baa92563b539746e71))

## [0.1.9](https://github.com/aws/language-servers/compare/chat-client/v0.1.8...chat-client/v0.1.9) (2025-05-09)


### Bug Fixes

* add visibleName property to fix empty directory name when the directory ends with a slash ([#1302](https://github.com/aws/language-servers/issues/1302)) ([f6d573c](https://github.com/aws/language-servers/commit/f6d573cc8e6b23cfdcfd9baa5a5c8e705579b23c))
* fix for status duplicates for permission checks ([#1237](https://github.com/aws/language-servers/issues/1237)) ([a77949a](https://github.com/aws/language-servers/commit/a77949a482cd352ebc5c7eeebb1468a052a5496d))
* permission check ux changes ([#1290](https://github.com/aws/language-servers/issues/1290)) ([170113f](https://github.com/aws/language-servers/commit/170113f97eccf7827cfc72da33d9dc9c7e4afb3f))
* prefix if user reject/stop command, whole card should be dimmed ([#1212](https://github.com/aws/language-servers/issues/1212)) ([394db61](https://github.com/aws/language-servers/commit/394db61133e09cfaeff2f7510ab60c571c562130))
* stop button showing in non-agentic chat ([#1230](https://github.com/aws/language-servers/issues/1230)) ([5c1b6c2](https://github.com/aws/language-servers/commit/5c1b6c2ed992befca03120635a23b4aa8cda5ebf))
* stop chat response first when close tab ([#1292](https://github.com/aws/language-servers/issues/1292)) ([3733b43](https://github.com/aws/language-servers/commit/3733b433a771ece77ae83f55c8e8e3bd13dcd96b))
* undo buttom not dimmed the card ([#1276](https://github.com/aws/language-servers/issues/1276)) ([49bd9c9](https://github.com/aws/language-servers/commit/49bd9c95d8f9213fe878720a20c13d8f045778ee))

## [0.1.8](https://github.com/aws/language-servers/compare/chat-client/v0.1.7...chat-client/v0.1.8) (2025-05-07)


### Bug Fixes

* fix for status duplicates for permission checks ([#1237](https://github.com/aws/language-servers/issues/1237)) ([a77949a](https://github.com/aws/language-servers/commit/a77949a482cd352ebc5c7eeebb1468a052a5496d))
* prefix if user reject/stop command, whole card should be dimmed ([#1212](https://github.com/aws/language-servers/issues/1212)) ([394db61](https://github.com/aws/language-servers/commit/394db61133e09cfaeff2f7510ab60c571c562130))
* stop button showing in non-agentic chat ([#1230](https://github.com/aws/language-servers/issues/1230)) ([5c1b6c2](https://github.com/aws/language-servers/commit/5c1b6c2ed992befca03120635a23b4aa8cda5ebf))

## [0.1.7](https://github.com/aws/language-servers/compare/chat-client/v0.1.6...chat-client/v0.1.7) (2025-05-06)


### Bug Fixes

* prefix if user reject/stop command, whole card should be dimmed ([#1212](https://github.com/aws/language-servers/issues/1212)) ([394db61](https://github.com/aws/language-servers/commit/394db61133e09cfaeff2f7510ab60c571c562130))

## [0.1.6](https://github.com/aws/language-servers/compare/chat-client/v0.1.5...chat-client/v0.1.6) (2025-05-02)


### Bug Fixes

* fix for status duplicates for permission checks ([#1237](https://github.com/aws/language-servers/issues/1237)) ([a77949a](https://github.com/aws/language-servers/commit/a77949a482cd352ebc5c7eeebb1468a052a5496d))
* stop button showing in non-agentic chat ([#1230](https://github.com/aws/language-servers/issues/1230)) ([5c1b6c2](https://github.com/aws/language-servers/commit/5c1b6c2ed992befca03120635a23b4aa8cda5ebf))

## [0.1.5](https://github.com/aws/language-servers/compare/chat-client/v0.1.4...chat-client/v0.1.5) (2025-05-01)


### Features

* add [@workspace](https://github.com/workspace) context in agentic chat ([#1029](https://github.com/aws/language-servers/issues/1029)) ([f2916f4](https://github.com/aws/language-servers/commit/f2916f45c351a42a9951ff00bcb7f7eed3ce7274))
* add explanation text as directive ([#1054](https://github.com/aws/language-servers/issues/1054)) ([a0ca8e0](https://github.com/aws/language-servers/commit/a0ca8e0059a26ac7f21e04940ad120c3de268df9))
* add header and buttons to chat response ([#1020](https://github.com/aws/language-servers/issues/1020)) ([ada6c7f](https://github.com/aws/language-servers/commit/ada6c7fd36dc9f64f093d7629e957d23e322848d))
* add pair programming card ([#1023](https://github.com/aws/language-servers/issues/1023)) ([59cf153](https://github.com/aws/language-servers/commit/59cf15385c320e6644b04548e1eb61a68ca784de))
* add stop button for execute bash ([#1150](https://github.com/aws/language-servers/issues/1150)) ([9cf2013](https://github.com/aws/language-servers/commit/9cf2013d30434a8a03f2497fc9b1e2a727c33918))
* add the grepSearch tool ([#1109](https://github.com/aws/language-servers/issues/1109)) ([6016264](https://github.com/aws/language-servers/commit/601626428b6ac968fe85257a09478e94263a5a1e))
* added support for injecting additional context commands ([#1045](https://github.com/aws/language-servers/issues/1045)) ([d755da3](https://github.com/aws/language-servers/commit/d755da36bd7bf76684aceafb6a2cbc2f8f76291e))
* **amazonq:** add pair programming toggle ([#1013](https://github.com/aws/language-servers/issues/1013)) ([7266d32](https://github.com/aws/language-servers/commit/7266d32b2fb73ead40abecb22749a2c9e5206a2a))
* **amazonq:** initial implementation of read/list chat result ([#1024](https://github.com/aws/language-servers/issues/1024)) ([890e45e](https://github.com/aws/language-servers/commit/890e45eae48930370089936880c77b10edb83059))
* **amazonq:** initial UI for execute bash chat message ([#1041](https://github.com/aws/language-servers/issues/1041)) ([b3ed518](https://github.com/aws/language-servers/commit/b3ed518f27251742c392138f05b02281dfcddcac))
* **chat-client:** add feature flag to toggle agentic mode ([#1172](https://github.com/aws/language-servers/issues/1172)) ([8d3d5eb](https://github.com/aws/language-servers/commit/8d3d5eb49638f858ddf3f99e443bda8f63680872))
* **chat-client:** handle chat updates for existing messages ([#1048](https://github.com/aws/language-servers/issues/1048)) ([74abb12](https://github.com/aws/language-servers/commit/74abb126a736e3c37beb492bc7405b02c953296c))
* **chat-client:** history list and conversation actions ([#929](https://github.com/aws/language-servers/issues/929)) ([5b8e83c](https://github.com/aws/language-servers/commit/5b8e83cacc56d854623a6e2b59f2f920538f5b85))
* **chat-client:** implement export conversation flow ([#944](https://github.com/aws/language-servers/issues/944)) ([63fd2dc](https://github.com/aws/language-servers/commit/63fd2dc773e742c47040fd66aac4912664d91dd0))
* **chat-client:** open use input prompt for agentic chat and new prompt should st… ([#1081](https://github.com/aws/language-servers/issues/1081)) ([ca1a01d](https://github.com/aws/language-servers/commit/ca1a01dd0487e13f91c36f5288dc1b3b0232c682))
* **chat-client:** support profile banner changes ([#988](https://github.com/aws/language-servers/issues/988)) ([e4d4ef0](https://github.com/aws/language-servers/commit/e4d4ef026c8a60cc1ddf08c981340a902d628016))
* configure history button based on history enabled/disabled ([#957](https://github.com/aws/language-servers/issues/957)) ([eded88f](https://github.com/aws/language-servers/commit/eded88fae2311c2a73d377a479933f9f66df137d))
* handle fileClick events ([#919](https://github.com/aws/language-servers/issues/919)) ([511be2e](https://github.com/aws/language-servers/commit/511be2e2e6f527039a99f53cb76fbfc180ef9b55))
* implement new sendToPrompt params ([ef03312](https://github.com/aws/language-servers/commit/ef03312dcd9638afa09360bc7331d8753e576c11))
* implement restore tab ([#933](https://github.com/aws/language-servers/issues/933)) ([ad2c5d7](https://github.com/aws/language-servers/commit/ad2c5d77e497e9f8a2019eb547b164f5c5992160))
* initial fsWrite chat message ([#1026](https://github.com/aws/language-servers/issues/1026)) ([3fc6e85](https://github.com/aws/language-servers/commit/3fc6e85e14614a86982b9fb85317c923784a05af))
* open use input prompt for agentic chat and new prompt should stop current response ([ca1a01d](https://github.com/aws/language-servers/commit/ca1a01dd0487e13f91c36f5288dc1b3b0232c682))
* render additional chat messages ([#1025](https://github.com/aws/language-servers/issues/1025)) ([3a87baa](https://github.com/aws/language-servers/commit/3a87baa96cacba40f3fa920e4a02d26aa01a7058))
* route button event through chat-client.  ([#1037](https://github.com/aws/language-servers/issues/1037)) ([c6bb6c5](https://github.com/aws/language-servers/commit/c6bb6c5e81f0c639657e36e1989f6bae3ef47f38))
* support view diff for fsWrite ([#1042](https://github.com/aws/language-servers/issues/1042)) ([98291cb](https://github.com/aws/language-servers/commit/98291cb62a43176ec176bcdd92aa7746d08b9740))
* undo-all button ([#1153](https://github.com/aws/language-servers/issues/1153)) ([82ffd10](https://github.com/aws/language-servers/commit/82ffd106b550bc314f46d52ffb30470316022825))
* update confirm header after button click WIP ([#1062](https://github.com/aws/language-servers/issues/1062)) ([f396bd6](https://github.com/aws/language-servers/commit/f396bd658df4200b595cd62687d2ed19ef68ec58))
* workspace open settings ([#1055](https://github.com/aws/language-servers/issues/1055)) ([f3018da](https://github.com/aws/language-servers/commit/f3018da706663b0f64bc5b4becc2fd600d5ff5b6))


### Bug Fixes

* add file list card separate from permission card for tool execut… ([#1129](https://github.com/aws/language-servers/issues/1129)) ([e9b654e](https://github.com/aws/language-servers/commit/e9b654ecd5ba998e57fc67ae61278a9a497e060a))
* add file list card separate from permission card for tool executions outside workspace ([e9b654e](https://github.com/aws/language-servers/commit/e9b654ecd5ba998e57fc67ae61278a9a497e060a))
* adding message if user clicks on stop button ([#1219](https://github.com/aws/language-servers/issues/1219)) ([50de37d](https://github.com/aws/language-servers/commit/50de37d6ab3d6d91fcb180653ef9b9e35869d517))
* adding tooltip description to filePaths ([#1136](https://github.com/aws/language-servers/issues/1136)) ([a0bdf7d](https://github.com/aws/language-servers/commit/a0bdf7d6e17c042c6882859b8fea85161140753a))
* **amazonq:** add validation for create a saved prompt UX ([#1116](https://github.com/aws/language-servers/issues/1116)) ([a72d4d2](https://github.com/aws/language-servers/commit/a72d4d2cf2df883ae3c4b143b65d1373433a4b58))
* **amazonq:** bundle dependencies ([4a128e7](https://github.com/aws/language-servers/commit/4a128e78b275d13af13e9c9f059da01b892fb017))
* **amazonq:** hide stop generating button in hybrid chat ([#1006](https://github.com/aws/language-servers/issues/1006)) ([c2b7c25](https://github.com/aws/language-servers/commit/c2b7c2549ead850a7c568a64830b2f151bee005a))
* **amazonq:** include mynah ui ([b1dae1b](https://github.com/aws/language-servers/commit/b1dae1b85e58dcedc7f102d2643f345c6cade135))
* **amazonq:** recursively create directory for saved user prompts ([#1148](https://github.com/aws/language-servers/issues/1148)) ([94290cb](https://github.com/aws/language-servers/commit/94290cb1ea8668d76f37ae19d099d50717aff670))
* **amazonq:** reference local path ([a43366d](https://github.com/aws/language-servers/commit/a43366d62df5bf9c173f633c08b666d9492ea19d))
* change PP icon ([#1154](https://github.com/aws/language-servers/issues/1154)) ([e31fcef](https://github.com/aws/language-servers/commit/e31fcef7e103be2132710d229c16327c5e996162))
* change PPM switch info text cards ([c8c7d05](https://github.com/aws/language-servers/commit/c8c7d056a571bc407d029345d19de9f7709e181f))
* **chat-client:** disable click event for empty history list item ([#973](https://github.com/aws/language-servers/issues/973)) ([bc20a04](https://github.com/aws/language-servers/commit/bc20a04277a7b603e0d0c5e623c87b2a5c4dc4d4))
* **chat-client:** do not route onTabBarButtonClick to custom handler ([08a5a5b](https://github.com/aws/language-servers/commit/08a5a5b76432aa370ef2ae3fc2ac70f922458c36))
* **chat-client:** fix the warning icon ([#1126](https://github.com/aws/language-servers/issues/1126)) ([c3ecda6](https://github.com/aws/language-servers/commit/c3ecda6317d2b78bac03d2fb4b3b6b011763cd00))
* **chat-client:** missing break in getSerializedChat request handling ([#978](https://github.com/aws/language-servers/issues/978)) ([5555d09](https://github.com/aws/language-servers/commit/5555d09f2c024621ae706e01a8cac70f5582a7d8))
* **chat-client:** string change ([#1118](https://github.com/aws/language-servers/issues/1118)) ([f21700a](https://github.com/aws/language-servers/commit/f21700a6b8573838a3e28e4e087f6864550fa9f2))
* **chat-client:** upgrade to mynah-ui 4.31.1 ([#1165](https://github.com/aws/language-servers/issues/1165)) ([aa45998](https://github.com/aws/language-servers/commit/aa45998c6c63a043788a427ddb5f8859854791ab))
* convert switch to checkbox for PPM mode ([#1099](https://github.com/aws/language-servers/issues/1099)) ([15c171f](https://github.com/aws/language-servers/commit/15c171f701587de992c14762d9de9698f6846ee6))
* decrease header size for Pair Programmer ([#1216](https://github.com/aws/language-servers/issues/1216)) ([7ec43e9](https://github.com/aws/language-servers/commit/7ec43e9c00bfee443bd81d5bff3aee9ba3350cae))
* execute command should show when no approval required & add more loading ([#1091](https://github.com/aws/language-servers/issues/1091)) ([5c48989](https://github.com/aws/language-servers/commit/5c48989d18665b84578b9c4bc49a5f3928754619))
* export for answer-stream card item ([#1019](https://github.com/aws/language-servers/issues/1019)) ([c367ef3](https://github.com/aws/language-servers/commit/c367ef3a1374032dace0e6755eaa43a1fae6e3c4))
* fix execute command header flickering issue ([#1177](https://github.com/aws/language-servers/issues/1177)) ([dc5d360](https://github.com/aws/language-servers/commit/dc5d36029102f845617ed791f252e115fef57686))
* fix header incorrectly added to other message issue ([dc5d360](https://github.com/aws/language-servers/commit/dc5d36029102f845617ed791f252e115fef57686))
* fix ppm mode switch texts ([#1196](https://github.com/aws/language-servers/issues/1196)) ([c8c7d05](https://github.com/aws/language-servers/commit/c8c7d056a571bc407d029345d19de9f7709e181f))
* fix the build after merge with main ([#1213](https://github.com/aws/language-servers/issues/1213)) ([6d79bc7](https://github.com/aws/language-servers/commit/6d79bc7dbbc5aa9168c6d5815efc98ea7ead51e0))
* Fixes the issue of collapsing the files and folders while streaming response. ([#1161](https://github.com/aws/language-servers/issues/1161)) ([8d8521b](https://github.com/aws/language-servers/commit/8d8521bbec0e9bf068bef34fac45f224c0ca9b05))
* further improvements for thinking/loading ([#1125](https://github.com/aws/language-servers/issues/1125)) ([5e091d7](https://github.com/aws/language-servers/commit/5e091d704cbd3dd4cd3a2a97f0234f029cc49247))
* highlight command mistype ([#1060](https://github.com/aws/language-servers/issues/1060)) ([69742be](https://github.com/aws/language-servers/commit/69742be4348f04f5c683be4dfaa499a7700e99f5))
* immediate full results not getting rendered e.g /help ([#1193](https://github.com/aws/language-servers/issues/1193)) ([8169b26](https://github.com/aws/language-servers/commit/8169b263ab62c5315451b6c8a4d5989375a23fdd))
* improve chat rendering if there are additional chat messages ([#1039](https://github.com/aws/language-servers/issues/1039)) ([70a086a](https://github.com/aws/language-servers/commit/70a086a823fc56dcd068dee0fa3147cb06684b9a))
* incorrect props for fsWrite message ([#1043](https://github.com/aws/language-servers/issues/1043)) ([03deddf](https://github.com/aws/language-servers/commit/03deddf0f756629e7459a71236e408c0ef3e9727))
* loading appears too often ([#1179](https://github.com/aws/language-servers/issues/1179)) ([80aa92e](https://github.com/aws/language-servers/commit/80aa92e6b658fe07258bc3d04cb453656e69b7f7))
* onFileClick logic is crashing the whole process if no workspace is open ([#1119](https://github.com/aws/language-servers/issues/1119)) ([0211223](https://github.com/aws/language-servers/commit/0211223a93dd3ddcb5b7b06882e2a10eb09fa01c))
* override the MynahUi default config ([#1183](https://github.com/aws/language-servers/issues/1183)) ([55b60dd](https://github.com/aws/language-servers/commit/55b60ddd4a4b204c6f7c5a256b2de10abeb9844b))
* prompt options override ([#1171](https://github.com/aws/language-servers/issues/1171)) ([70e1e1c](https://github.com/aws/language-servers/commit/70e1e1c55ad229f13f202f34d621bbd8f8e3475a))
* remove duplicate property ([#928](https://github.com/aws/language-servers/issues/928)) ([c1aaec0](https://github.com/aws/language-servers/commit/c1aaec06b70f4ef9d5e2a7ad0d1cc4d5d6955087))
* remove examples from welcome message ([#1040](https://github.com/aws/language-servers/issues/1040)) ([82138b3](https://github.com/aws/language-servers/commit/82138b37288ac7dc142b5a9f4ee1e5e70b5ef34a))
* remove loading when stop clicked and add loading when request in progress ([#1117](https://github.com/aws/language-servers/issues/1117)) ([40098dd](https://github.com/aws/language-servers/commit/40098ddc0277a1f29339b15d0950917143d2178b))
* remove undefined header from followup authenticate button ([#1085](https://github.com/aws/language-servers/issues/1085)) ([1502bb9](https://github.com/aws/language-servers/commit/1502bb922117db8fc9f1cfd74db092be5fbba13b))
* remvoe code block insert-to-cursor in pp mode ([#1092](https://github.com/aws/language-servers/issues/1092)) ([6d12f3e](https://github.com/aws/language-servers/commit/6d12f3e4b0c78614786228b63cf6bbf34588ca1c))
* replaced icon for history and added tests ([#951](https://github.com/aws/language-servers/issues/951)) ([da3b664](https://github.com/aws/language-servers/commit/da3b66414514740f514d96279b826aebc4e86077))
* save ([#1035](https://github.com/aws/language-servers/issues/1035)) ([d115563](https://github.com/aws/language-servers/commit/d115563b96c41ae571fdf0d0525776ce83de9026))
* spinner text should now say Thinking... ([#1058](https://github.com/aws/language-servers/issues/1058)) ([0bd7f38](https://github.com/aws/language-servers/commit/0bd7f38ddce4ca0919a2573bfca1fe0888677bda))
* string changes ([#1225](https://github.com/aws/language-servers/issues/1225)) ([584450f](https://github.com/aws/language-servers/commit/584450fba054f4bbcd702ab49a58e45d9abd3d1f))
* thinking does not always appear ([#1152](https://github.com/aws/language-servers/issues/1152)) ([df231b9](https://github.com/aws/language-servers/commit/df231b9d73807d1696c3f7cdd474186dd8530b26))
* tool cards have the wrong props ([#1084](https://github.com/aws/language-servers/issues/1084)) ([697dd18](https://github.com/aws/language-servers/commit/697dd18a5da3e0f6fec9d094a9b1170e94ed3f3b))
* update placeholder ghost message ([#1093](https://github.com/aws/language-servers/issues/1093)) ([0d2c76e](https://github.com/aws/language-servers/commit/0d2c76e8f681671c57d7cc4fe574c855dad19e93))
* update pp mode in tab store ([#1128](https://github.com/aws/language-servers/issues/1128)) ([7c5e5a8](https://github.com/aws/language-servers/commit/7c5e5a82437c532a304ec9ab04971f2b9c85f0ad))
* updated spacings through mynah-ui update ([#1214](https://github.com/aws/language-servers/issues/1214)) ([b8e8fab](https://github.com/aws/language-servers/commit/b8e8fab94c5d8b9b8ed4dacff8bb38de0a31750d))
* updating strings for agentic coding experience ([#1223](https://github.com/aws/language-servers/issues/1223)) ([8302c5e](https://github.com/aws/language-servers/commit/8302c5e135921f212f63ada664ab5f88610119fc))

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
