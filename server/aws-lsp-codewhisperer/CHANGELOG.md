# Changelog

## [0.0.44](https://github.com/aws/language-servers/compare/lsp-codewhisperer/v0.0.43...lsp-codewhisperer/v0.0.44) (2025-06-05)


### Bug Fixes

* **amazonq:** always restore chat tabs when onReady is received ([#1524](https://github.com/aws/language-servers/issues/1524)) ([54fa813](https://github.com/aws/language-servers/commit/54fa813eb124cc3e59c30390a9ec2cc7303f9a1d))
* rename fuzzySearch tool name ([#1512](https://github.com/aws/language-servers/issues/1512)) ([4d65c92](https://github.com/aws/language-servers/commit/4d65c92c87fb1138fcaa6f023518122823b60ba4))

## [0.0.43](https://github.com/aws/language-servers/compare/lsp-codewhisperer/v0.0.42...lsp-codewhisperer/v0.0.43) (2025-06-04)


### Bug Fixes

* disable grep search ([#1514](https://github.com/aws/language-servers/issues/1514)) ([f4f66fa](https://github.com/aws/language-servers/commit/f4f66fa3d5f8a335ae696506a4e92afe0deb262b))
* model doesn't update in session for new tabs ([#1506](https://github.com/aws/language-servers/issues/1506)) ([89aa1ef](https://github.com/aws/language-servers/commit/89aa1efade5ff9421eaf8c66db55d0a9fb8bd283))

## [0.0.42](https://github.com/aws/language-servers/compare/lsp-codewhisperer/v0.0.41...lsp-codewhisperer/v0.0.42) (2025-06-02)


### Features

* **amazonq:** send relative file path for inline completion ([#1481](https://github.com/aws/language-servers/issues/1481)) ([35e4143](https://github.com/aws/language-servers/commit/35e4143dbaaeec8f3921b8859ce5a7451f099859))
* model selection for agentic chat ([#1294](https://github.com/aws/language-servers/issues/1294)) ([10abd04](https://github.com/aws/language-servers/commit/10abd041d340b1b6fe6adad81cc1f6bd1610826e))


### Bug Fixes

* add environment variable override to disable indexing library init ([#1504](https://github.com/aws/language-servers/issues/1504)) ([01e9662](https://github.com/aws/language-servers/commit/01e9662cafb5a86e63a23cf908c0d01aede4db89))
* **amazonq:** fix line endings before fswrite for windows ([#1483](https://github.com/aws/language-servers/issues/1483)) ([9e4c284](https://github.com/aws/language-servers/commit/9e4c28480f0660e10cbfce154323996ace7aea2b))
* **amazonq:** pagination request should also used truncated left/right context ([#1497](https://github.com/aws/language-servers/issues/1497)) ([0a4ab2c](https://github.com/aws/language-servers/commit/0a4ab2ceffe0d3d759587199912adbc84dfb598f))
* extra line when user run the command ([#1499](https://github.com/aws/language-servers/issues/1499)) ([86a17f5](https://github.com/aws/language-servers/commit/86a17f582ed21000ebc48fcab317b2cb212c4488))
* fix paths array issue in fsRead ([#1496](https://github.com/aws/language-servers/issues/1496)) ([4bf8624](https://github.com/aws/language-servers/commit/4bf8624f6474590cb0632c9530ca6ff624ac2358))
* grepSearch on Windows ([#1494](https://github.com/aws/language-servers/issues/1494)) ([57fca2f](https://github.com/aws/language-servers/commit/57fca2f0423ad485570f59e6921f36addb7d43a7))
* improve the executeBash tool spec ([#1465](https://github.com/aws/language-servers/issues/1465)) ([cab801b](https://github.com/aws/language-servers/commit/cab801b3f7ad77c1fc99d06426fd8ba481109b54))

## [0.0.41](https://github.com/aws/language-servers/compare/lsp-codewhisperer/v0.0.40...lsp-codewhisperer/v0.0.41) (2025-05-30)


### Features

* **amazonq:** add abap as supported language [#1463](https://github.com/aws/language-servers/issues/1463) ([116ea07](https://github.com/aws/language-servers/commit/116ea07d4ae4744bb105f474d0d964c366673e7e))


### Bug Fixes

* add tests for workspace change supports ([#1484](https://github.com/aws/language-servers/issues/1484)) ([30559cb](https://github.com/aws/language-servers/commit/30559cb8a394e2f0e11b3150d7480d463014ea78))
* **amazonq:** fix for honouring the index cache dir path value ([#1448](https://github.com/aws/language-servers/issues/1448)) ([40e15b7](https://github.com/aws/language-servers/commit/40e15b75ec514bb7019affdebdb12b923370bf27))
* **amazonq:** fix UTDE suggestion state for pagination cases ([#1433](https://github.com/aws/language-servers/issues/1433)) ([6bf21e5](https://github.com/aws/language-servers/commit/6bf21e52fc0b7cefb7ee8c0ac820ad7825ba7de7))
* **amazonq:** wrap sspc lsp handlers in try/catch so failures do not take down server ([#1464](https://github.com/aws/language-servers/issues/1464)) ([6a731cb](https://github.com/aws/language-servers/commit/6a731cb680d0574b4033f1fe209f788eb1fae221))
* convert array values to comma-separated strings in telemetry metrics emitAgencticLoop_InvokeLLM ([#1458](https://github.com/aws/language-servers/issues/1458)) ([6682e21](https://github.com/aws/language-servers/commit/6682e2169f7f3815362d2d3a4bcdef809dea8c27))
* decode UTF-16LE shell output on Windows ([#1456](https://github.com/aws/language-servers/issues/1456)) ([ae48442](https://github.com/aws/language-servers/commit/ae48442f499589560ff0bc9e3832171c98e53abb))
* enable fuzzySearch tool ([#1328](https://github.com/aws/language-servers/issues/1328)) ([93d9c9c](https://github.com/aws/language-servers/commit/93d9c9ca704b59769eca0ce45857db6f9de88aa6))
* enable grepSearch tool ([#1396](https://github.com/aws/language-servers/issues/1396)) ([a3a39de](https://github.com/aws/language-servers/commit/a3a39de85f822e10fe5a9e9d88165fa26739bc87))
* ensure local index server updates with workspaceChangeEvent and bump runtimes ([#1424](https://github.com/aws/language-servers/issues/1424)) ([9babbb6](https://github.com/aws/language-servers/commit/9babbb643daa2893454dbc977d3802822b2c0aa6))
* fix uncaught exception in workspaceFolderManager ([#1428](https://github.com/aws/language-servers/issues/1428)) ([1b15457](https://github.com/aws/language-servers/commit/1b154570c9cf1eb1d56141095adea4459426b774))
* increase the code start and end line number by 1 ([#1470](https://github.com/aws/language-servers/issues/1470)) ([743666f](https://github.com/aws/language-servers/commit/743666fd18f262363a49a56bbd5063c24f1d4d31))
* properly tokenize command args using shlex.split() for Windows ([#1440](https://github.com/aws/language-servers/issues/1440)) ([9355003](https://github.com/aws/language-servers/commit/9355003f5feb030a7b3984122e180368bae29d06))
* reorder cancellation operations ([#1478](https://github.com/aws/language-servers/issues/1478)) ([0d392a7](https://github.com/aws/language-servers/commit/0d392a7996f6430d13e4d7171e320d5b0b0aaf43))
* update executeBash UI for failures during command existence check ([#1462](https://github.com/aws/language-servers/issues/1462)) ([7165301](https://github.com/aws/language-servers/commit/7165301ac8de36c34011d9fc8b066fa2fe3aff7e))
* use updated version of vecLib and use local context controller to raise context command updates ([#1479](https://github.com/aws/language-servers/issues/1479)) ([6d4280d](https://github.com/aws/language-servers/commit/6d4280d1eb61d3b10674a0aa137ae6fd2f5446bf))

## [0.0.40](https://github.com/aws/language-servers/compare/lsp-codewhisperer/v0.0.39...lsp-codewhisperer/v0.0.40) (2025-05-22)


### Features

* **amazonq:** add fileUri to FileContext ([#1399](https://github.com/aws/language-servers/issues/1399)) ([e5ede36](https://github.com/aws/language-servers/commit/e5ede36518557bcf969d0b7eecf1f3e6bda2f618))
* **amazonq:** integrate server side workspace context with inline completion ([#1402](https://github.com/aws/language-servers/issues/1402)) ([cf0f6b3](https://github.com/aws/language-servers/commit/cf0f6b38f8b6bc22f134c50642fcba8281a24479))
* bump logging level of critical messages ([#1358](https://github.com/aws/language-servers/issues/1358)) ([d0bf283](https://github.com/aws/language-servers/commit/d0bf283e9af9321baf8fc2333c702f0317ad7daa))
* integrate server side project context into agentic chat ([#1405](https://github.com/aws/language-servers/issues/1405)) ([e4d8f61](https://github.com/aws/language-servers/commit/e4d8f6144aefdd59543f380be59ab63c6bf9e291))
* launch one remote workspace for all workspace folders ([#1348](https://github.com/aws/language-servers/issues/1348)) ([c240997](https://github.com/aws/language-servers/commit/c24099727c708994f319d9294068f6dee2a75b26))
* migrate inline completion telemetry to Flare ([#1336](https://github.com/aws/language-servers/issues/1336)) ([fcbdde4](https://github.com/aws/language-servers/commit/fcbdde4593cb55a728b996d3e04e90f9b6c6fa70))


### Bug Fixes

* accidental formatting [#1410](https://github.com/aws/language-servers/issues/1410) ([3774f40](https://github.com/aws/language-servers/commit/3774f405921a9ba26df4de6cc4044d1fa70f09a3))
* add crypto import ([#1408](https://github.com/aws/language-servers/issues/1408)) ([6d5a5cf](https://github.com/aws/language-servers/commit/6d5a5cf545d882e7ce3afb93028ad2b4a4bcbb8e))
* add grepSearch implementation ([#1359](https://github.com/aws/language-servers/issues/1359)) ([1260dce](https://github.com/aws/language-servers/commit/1260dcedb0839d7dd6ee0bb159e5f5bb3cbe5f3a))
* add requestIds for each LLM call for amazonq_addMessage metric ([#1338](https://github.com/aws/language-servers/issues/1338)) ([4324c90](https://github.com/aws/language-servers/commit/4324c90224ad9f94b82d9e68e80f7563bdb5f2ea))
* add robust validation logic to fixHistory ([#1340](https://github.com/aws/language-servers/issues/1340)) ([14dac87](https://github.com/aws/language-servers/commit/14dac87358c7e1fd79a5e49614fd33c46d43bf72))
* add validation for empty chat history ([#1403](https://github.com/aws/language-servers/issues/1403)) ([83d83b0](https://github.com/aws/language-servers/commit/83d83b0a22a5c3fb7cdad18c1fa829ee54f37119))
* adding error handling for export tab ([#1350](https://github.com/aws/language-servers/issues/1350)) ([6bdd1ac](https://github.com/aws/language-servers/commit/6bdd1acb22bb089f8a5fd257a2fe47e212650382))
* adding new telemetry metrics and addtional fields for existing metrics ([#1341](https://github.com/aws/language-servers/issues/1341)) ([d242225](https://github.com/aws/language-servers/commit/d2422252a27c57b05609c0829b0741b29c4d9236))
* **amazonq:** Use common utility to determine workspaceFolders and fix tests ([#1353](https://github.com/aws/language-servers/issues/1353)) ([483f532](https://github.com/aws/language-servers/commit/483f532b940d3ff2e914c0824f7501c3fe6a6235))
* change the version to axios to ^1.8.4 ([#1421](https://github.com/aws/language-servers/issues/1421)) ([f127538](https://github.com/aws/language-servers/commit/f127538832d01ebaf0638a0512dc9f0837b8f2ff))
* convert RTS improperly formed request error to 500 ([#1356](https://github.com/aws/language-servers/issues/1356)) ([9d74a17](https://github.com/aws/language-servers/commit/9d74a17dd850dbe59a34b75ffb563e037856485b))
* emit telemetry event to RTS when failed or cancelled ([#1384](https://github.com/aws/language-servers/issues/1384)) ([2e542ae](https://github.com/aws/language-servers/commit/2e542aebb2da37a747ae9dbd6b1fd25e95cf6d93))
* handle requestAborted errors silently ([#1394](https://github.com/aws/language-servers/issues/1394)) ([6b12b54](https://github.com/aws/language-servers/commit/6b12b544fbd84b9c57662754ba27aea491be9048))
* missing handle connection expired error for inline suggestions ([#1373](https://github.com/aws/language-servers/issues/1373)) ([05c7728](https://github.com/aws/language-servers/commit/05c772821e60ba8a6b066b26ca6811d3d9c55455))
* move generateAssistant request log statement ([#1379](https://github.com/aws/language-servers/issues/1379)) ([e258409](https://github.com/aws/language-servers/commit/e258409fb811769aa700046568c269622daf1ec9))
* only do render on partial results for fsWrite ([#1354](https://github.com/aws/language-servers/issues/1354)) ([9931592](https://github.com/aws/language-servers/commit/993159293edc32f7dc5bd0cfb999562ffee830ed))
* re-categorize error status code ([#1355](https://github.com/aws/language-servers/issues/1355)) ([a98a842](https://github.com/aws/language-servers/commit/a98a842fb5ac8d680e973d97058c22a49e5c3284))
* Reduce perceived latency of fsWrite. Show fsWrite errors in the UX  ([#1351](https://github.com/aws/language-servers/issues/1351)) ([f1e873b](https://github.com/aws/language-servers/commit/f1e873b95fbd119a0303ae1f234f9f1efa1fef56))
* remove limit on agentic loop ([#1367](https://github.com/aws/language-servers/issues/1367)) ([5943222](https://github.com/aws/language-servers/commit/59432220ba9495d3e5cdfd2d42321f412d1f2b13))
* Render timeout error, JSON parse error, cancellation to the in progress fs.write UI ([#1382](https://github.com/aws/language-servers/issues/1382)) ([f930297](https://github.com/aws/language-servers/commit/f9302976d9e916a88daac546efb8acba45c5a66e))
* Revert status code convertion ([#1370](https://github.com/aws/language-servers/issues/1370)) ([73e0c5b](https://github.com/aws/language-servers/commit/73e0c5b93861ed48c075588cd99e716066c2bc95))
* Set `source` parameter chat request context to 'IDE' ([#1407](https://github.com/aws/language-servers/issues/1407)) ([c8d6edf](https://github.com/aws/language-servers/commit/c8d6edf58e824c994ffe5c10bb970665375e0eb7))
* SSPC dependency upload and watcher fixes ([#1377](https://github.com/aws/language-servers/issues/1377)) ([a5833fe](https://github.com/aws/language-servers/commit/a5833fea3488f2e31877b5677fd532f5415b339c))
* the new prompt wont stop the process properly ([#1404](https://github.com/aws/language-servers/issues/1404)) ([6e3ec9b](https://github.com/aws/language-servers/commit/6e3ec9b7483fee74563b735440789d4add9158e0))
* truncate API payload ([#1368](https://github.com/aws/language-servers/issues/1368)) ([1120272](https://github.com/aws/language-servers/commit/112027253ca773e0b674c0527dd48c9ee8d9ddc4))
* Truncate API request context first, then truncate chat history ([#1372](https://github.com/aws/language-servers/issues/1372)) ([80fdbdf](https://github.com/aws/language-servers/commit/80fdbdfc27849e136b30d7a68727b3f53b03c8af))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @aws/lsp-core bumped from ^0.0.8 to ^0.0.9

## [0.0.39](https://github.com/aws/language-servers/compare/lsp-codewhisperer/v0.0.38...lsp-codewhisperer/v0.0.39) (2025-05-14)


### Bug Fixes

* **amazonq:** export q chat in windows not working due to invalid path ([#1330](https://github.com/aws/language-servers/issues/1330)) ([2dfc9cb](https://github.com/aws/language-servers/commit/2dfc9cbf53dad772ae40f96ce6e026b41d887a51))

## [0.0.38](https://github.com/aws/language-servers/compare/lsp-codewhisperer/v0.0.37...lsp-codewhisperer/v0.0.38) (2025-05-14)


### Features

* add userWrittenCodeTracker ([#1308](https://github.com/aws/language-servers/issues/1308)) ([c10819e](https://github.com/aws/language-servers/commit/c10819ea2c25ce564c75fb43a6792f3c919b757a))
* **amazonq:** telemetry for chat history and export ([#1314](https://github.com/aws/language-servers/issues/1314)) ([aaa08a4](https://github.com/aws/language-servers/commit/aaa08a4f29ac34f85ec9badf975d6e2e8d114627))
* merge updates for inline completions ([#1299](https://github.com/aws/language-servers/issues/1299)) ([44d81f0](https://github.com/aws/language-servers/commit/44d81f0b5754747d77bda60b40cc70950413a737))


### Bug Fixes

* allowing reading multiple files with fsRead, minor tool validation fix ([#1297](https://github.com/aws/language-servers/issues/1297)) ([6568811](https://github.com/aws/language-servers/commit/65688116c4ebf4e4bda821d30226bdb2a334ca3d))
* **amazonq:** 500k max input limit in user input box. Align payload prompt with user typed prompt. ([#1325](https://github.com/aws/language-servers/issues/1325)) ([3338cc1](https://github.com/aws/language-servers/commit/3338cc1b5dcfd375385d7db2fa693870687dba8a))
* bug fix for exportResultsArchive to call with profileArn as parameter ([#1300](https://github.com/aws/language-servers/issues/1300)) ([16162f6](https://github.com/aws/language-servers/commit/16162f67315d174acacb2feb163fa8d9044e147f))
* bug in skip edit for userWrittenCode ([#1315](https://github.com/aws/language-servers/issues/1315)) ([86a136b](https://github.com/aws/language-servers/commit/86a136b5db9c3a3d15e12421e9b941107842b475))
* bump runtimes and fix broken test ([#1323](https://github.com/aws/language-servers/issues/1323)) ([7d1a7b9](https://github.com/aws/language-servers/commit/7d1a7b9700ee2cc154dfe357ebbb62597d3f1582))
* duplicate suggestion in inline response ([#1331](https://github.com/aws/language-servers/issues/1331)) ([23b0c90](https://github.com/aws/language-servers/commit/23b0c901b9f98490af93b75abe6ccd44ed56fddf))
* truncate userInputMessage to first 500k characters ([#1327](https://github.com/aws/language-servers/issues/1327)) ([d6f84db](https://github.com/aws/language-servers/commit/d6f84db58f59afe85351380d7fad5320a2889f1c))
* update fileSearch toolSpec and implementation ([#1320](https://github.com/aws/language-servers/issues/1320)) ([4b18f25](https://github.com/aws/language-servers/commit/4b18f25dfb8595f18b2773dddaa5bfbc64cf519d))
* update ignore pattern of glob for sspc ([#1319](https://github.com/aws/language-servers/issues/1319)) ([6f56600](https://github.com/aws/language-servers/commit/6f566008a7b5b726418e3de535e55c63285de532))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @aws/lsp-core bumped from ^0.0.7 to ^0.0.8

## [0.0.37](https://github.com/aws/language-servers/compare/lsp-codewhisperer/v0.0.36...lsp-codewhisperer/v0.0.37) (2025-05-09)


### Features

* add request id to default log level ([#1221](https://github.com/aws/language-servers/issues/1221)) ([fe31f26](https://github.com/aws/language-servers/commit/fe31f266eb481d9899c4924f878fe49f6bfe94aa))
* adding a check before invoking workspace context ([#1227](https://github.com/aws/language-servers/issues/1227)) ([3202b6e](https://github.com/aws/language-servers/commit/3202b6e0654a8037a3be3c50afa60960ce7bda91))
* **amazonq:** add error code handling for transformation jobs ([#1174](https://github.com/aws/language-servers/issues/1174)) ([634587c](https://github.com/aws/language-servers/commit/634587c93f08315f0676608b6f8687d309104cac))
* customizations profiles update ([#1246](https://github.com/aws/language-servers/issues/1246)) ([ea589c5](https://github.com/aws/language-servers/commit/ea589c5422f478be84f112295d82b0edb902ff21))
* server side workspace context capability ([a65fec9](https://github.com/aws/language-servers/commit/a65fec9e0cb092ddc941b164fc049fb13bb628c5))


### Bug Fixes

* abandon requests with invalid toolResults ([#1274](https://github.com/aws/language-servers/issues/1274)) ([fd6ffcb](https://github.com/aws/language-servers/commit/fd6ffcba75ce116fb8b28edccd2424f07ff72834))
* add more common ignore patterns for listDirectory ([#1287](https://github.com/aws/language-servers/issues/1287)) ([e983bfe](https://github.com/aws/language-servers/commit/e983bfe116c1d77460a6a932b6bbd8345b46a6a0))
* add requestId to chat for QModelResponse errors ([#1284](https://github.com/aws/language-servers/issues/1284)) ([cfea9fa](https://github.com/aws/language-servers/commit/cfea9fa0ee58dcb936bb2debe63494870ea10ab0))
* add support for determing workspace folder with root uri/path on initialize ([#1210](https://github.com/aws/language-servers/issues/1210)) ([5fd3174](https://github.com/aws/language-servers/commit/5fd3174f386fd0e97b8f631d26f457f574d145c4))
* address bugs impacting indexing disabled functionality ([#1293](https://github.com/aws/language-servers/issues/1293)) ([18d86d4](https://github.com/aws/language-servers/commit/18d86d45ab4751a0cc981d440e9fda6c52029922))
* **amazonq:** add codewhispererCustomizationArn to codewhisperer_perceivedLatency ([#1285](https://github.com/aws/language-servers/issues/1285)) ([b0562ca](https://github.com/aws/language-servers/commit/b0562cac4e5cf9b6477e5fbce4a2ee14a0d2b562))
* clear history for `inputTooLong` errors ([#1268](https://github.com/aws/language-servers/issues/1268)) ([b00b014](https://github.com/aws/language-servers/commit/b00b0146b55452c6472d3bc9b44a80afe393b686))
* emit all errors to get total # of errors ([#1252](https://github.com/aws/language-servers/issues/1252)) ([b425a66](https://github.com/aws/language-servers/commit/b425a667082e67a20e6f265cb0e41d049d5149af))
* errors/cancellation not resetting undoAll state ([#1273](https://github.com/aws/language-servers/issues/1273)) ([823b199](https://github.com/aws/language-servers/commit/823b199b77de7e715caf31479b9ccc55b0a17445))
* filter out .git folder from listDirectory ([#1286](https://github.com/aws/language-servers/issues/1286)) ([547ecaf](https://github.com/aws/language-servers/commit/547ecafb561fd3d6bf7a264def829160901dd23a))
* fix for permission case for execute bash ([66612cd](https://github.com/aws/language-servers/commit/66612cd5fe625dba6d951bc300e538e896e5f392))
* fix for permission case for execute bash ([#1220](https://github.com/aws/language-servers/issues/1220)) ([66612cd](https://github.com/aws/language-servers/commit/66612cd5fe625dba6d951bc300e538e896e5f392))
* fix the extra line on executeBash and wrong warning msg for outside workspace ([#1240](https://github.com/aws/language-servers/issues/1240)) ([eacc047](https://github.com/aws/language-servers/commit/eacc0475f2fe0362c155a2bd6be1715b2561d356))
* hide non-user-generated messages when reloading history ([#1257](https://github.com/aws/language-servers/issues/1257)) ([9540f12](https://github.com/aws/language-servers/commit/9540f12c7d9495b481d0cf61ad2b2c0b8339f156))
* improve data synchronization of server side workspace context ([#1278](https://github.com/aws/language-servers/issues/1278)) ([f50c4a7](https://github.com/aws/language-servers/commit/f50c4a71103b82a9780e542eef2e3622c16332d5))
* make LLM less apologetic, increase listDirectory result size ([#1242](https://github.com/aws/language-servers/issues/1242)) ([572cabb](https://github.com/aws/language-servers/commit/572cabb1036171438fe97898f72c85383628bcfd))
* only keep toolUses with `stop` = true in history ([#1235](https://github.com/aws/language-servers/issues/1235)) ([1edb6af](https://github.com/aws/language-servers/commit/1edb6af0425a3613d7dccb795b7d8178bf1c803c))
* permission check ux changes ([#1290](https://github.com/aws/language-servers/issues/1290)) ([170113f](https://github.com/aws/language-servers/commit/170113f97eccf7827cfc72da33d9dc9c7e4afb3f))
* prevent timeout messages from displaying ([#1282](https://github.com/aws/language-servers/issues/1282)) ([a154209](https://github.com/aws/language-servers/commit/a154209f0c2f16ab95eee4cf629676c811431011))
* projectRoot passed to vecLib was malformed ([#1250](https://github.com/aws/language-servers/issues/1250)) ([def522d](https://github.com/aws/language-servers/commit/def522daee62ea37556fefe12352ef28f38523d1))
* regex should match workspace text in bold style and startLine can be 0 ([#1272](https://github.com/aws/language-servers/issues/1272)) ([16d6a9d](https://github.com/aws/language-servers/commit/16d6a9d6bc6b23bfda09fb08147e76941809e3f1))
* removing warning icon for shell commands ([#1233](https://github.com/aws/language-servers/issues/1233)) ([18b2a18](https://github.com/aws/language-servers/commit/18b2a183ddeb3b58e3ebc9931cea08c1cf781bb7))
* server side timeout causes ISE ([#1254](https://github.com/aws/language-servers/issues/1254)) ([9cb2440](https://github.com/aws/language-servers/commit/9cb2440c165a296e11e0597e14b6c6aa7205f313))
* set streamingClient timeout config ([#1283](https://github.com/aws/language-servers/issues/1283)) ([cc7680d](https://github.com/aws/language-servers/commit/cc7680da85c6528d5f54f347b7ce922ffbba25b0))
* show context transparency list when using [@workspace](https://github.com/workspace) ([#1241](https://github.com/aws/language-servers/issues/1241)) ([291c0ba](https://github.com/aws/language-servers/commit/291c0ba945f311f6c1c071d048792de8735d17b8))
* show tooltip for warning message and remove the warning text  ([#1259](https://github.com/aws/language-servers/issues/1259)) ([312b04d](https://github.com/aws/language-servers/commit/312b04dbde37fbf1a1cc5d8884d62728edbc2810))
* switch to ignore entries over patterns ([#1236](https://github.com/aws/language-servers/issues/1236)) ([49ae714](https://github.com/aws/language-servers/commit/49ae7141024f9802d3ce671441f978f487a399aa))
* typo in cwsprChatTimeToFirstChunk and remove all zeros ([#1222](https://github.com/aws/language-servers/issues/1222)) ([4c940bc](https://github.com/aws/language-servers/commit/4c940bc20a3417e39d66ea73532f99a312d05e35))
* update header ignore status ([#1239](https://github.com/aws/language-servers/issues/1239)) ([6abf2fd](https://github.com/aws/language-servers/commit/6abf2fd27e8702a89f1ab306f363e04dfa27b978))
* update listDirectory tool to output in tree-like format to reduce toolSize ([#1260](https://github.com/aws/language-servers/issues/1260)) ([becfee0](https://github.com/aws/language-servers/commit/becfee0d36e9e2a5fb5239c1e34cc6661ca01d94))
* update reject button status ([#1253](https://github.com/aws/language-servers/issues/1253)) ([78c12c8](https://github.com/aws/language-servers/commit/78c12c8620367ac4276fb564e28ca58292cc8456))
* update undo-all-changes button icon to undo ([#1238](https://github.com/aws/language-servers/issues/1238)) ([6ebd5eb](https://github.com/aws/language-servers/commit/6ebd5eb8896a487189b79b1bbf1612ec9e95d064))
* use proper condition for trigger index enablement response ([#1258](https://github.com/aws/language-servers/issues/1258)) ([5aeb694](https://github.com/aws/language-servers/commit/5aeb694f495b8365c958bc9b626d0daf11718458))
* wrap load chats on ready in try-catch ([#1289](https://github.com/aws/language-servers/issues/1289)) ([7de86f0](https://github.com/aws/language-servers/commit/7de86f01460c8615f60548d3bd27a87bbc03e6f8))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @aws/lsp-core bumped from ^0.0.6 to ^0.0.7

## [0.0.36](https://github.com/aws/language-servers/compare/lsp-codewhisperer/v0.0.35...lsp-codewhisperer/v0.0.36) (2025-05-07)


### Features

* add request id to default log level ([#1221](https://github.com/aws/language-servers/issues/1221)) ([fe31f26](https://github.com/aws/language-servers/commit/fe31f266eb481d9899c4924f878fe49f6bfe94aa))
* adding a check before invoking workspace context ([#1227](https://github.com/aws/language-servers/issues/1227)) ([3202b6e](https://github.com/aws/language-servers/commit/3202b6e0654a8037a3be3c50afa60960ce7bda91))
* **amazonq:** add error code handling for transformation jobs ([#1174](https://github.com/aws/language-servers/issues/1174)) ([634587c](https://github.com/aws/language-servers/commit/634587c93f08315f0676608b6f8687d309104cac))
* customizations profiles update ([#1246](https://github.com/aws/language-servers/issues/1246)) ([ea589c5](https://github.com/aws/language-servers/commit/ea589c5422f478be84f112295d82b0edb902ff21))
* server side workspace context capability ([a65fec9](https://github.com/aws/language-servers/commit/a65fec9e0cb092ddc941b164fc049fb13bb628c5))


### Bug Fixes

* add support for determing workspace folder with root uri/path on initialize ([#1210](https://github.com/aws/language-servers/issues/1210)) ([5fd3174](https://github.com/aws/language-servers/commit/5fd3174f386fd0e97b8f631d26f457f574d145c4))
* clear history for `inputTooLong` errors ([#1268](https://github.com/aws/language-servers/issues/1268)) ([b00b014](https://github.com/aws/language-servers/commit/b00b0146b55452c6472d3bc9b44a80afe393b686))
* emit all errors to get total # of errors ([#1252](https://github.com/aws/language-servers/issues/1252)) ([b425a66](https://github.com/aws/language-servers/commit/b425a667082e67a20e6f265cb0e41d049d5149af))
* errors/cancellation not resetting undoAll state ([#1273](https://github.com/aws/language-servers/issues/1273)) ([823b199](https://github.com/aws/language-servers/commit/823b199b77de7e715caf31479b9ccc55b0a17445))
* fix for permission case for execute bash ([66612cd](https://github.com/aws/language-servers/commit/66612cd5fe625dba6d951bc300e538e896e5f392))
* fix for permission case for execute bash ([#1220](https://github.com/aws/language-servers/issues/1220)) ([66612cd](https://github.com/aws/language-servers/commit/66612cd5fe625dba6d951bc300e538e896e5f392))
* fix the extra line on executeBash and wrong warning msg for outside workspace ([#1240](https://github.com/aws/language-servers/issues/1240)) ([eacc047](https://github.com/aws/language-servers/commit/eacc0475f2fe0362c155a2bd6be1715b2561d356))
* hide non-user-generated messages when reloading history ([#1257](https://github.com/aws/language-servers/issues/1257)) ([9540f12](https://github.com/aws/language-servers/commit/9540f12c7d9495b481d0cf61ad2b2c0b8339f156))
* improve data synchronization of server side workspace context ([#1278](https://github.com/aws/language-servers/issues/1278)) ([f50c4a7](https://github.com/aws/language-servers/commit/f50c4a71103b82a9780e542eef2e3622c16332d5))
* make LLM less apologetic, increase listDirectory result size ([#1242](https://github.com/aws/language-servers/issues/1242)) ([572cabb](https://github.com/aws/language-servers/commit/572cabb1036171438fe97898f72c85383628bcfd))
* only keep toolUses with `stop` = true in history ([#1235](https://github.com/aws/language-servers/issues/1235)) ([1edb6af](https://github.com/aws/language-servers/commit/1edb6af0425a3613d7dccb795b7d8178bf1c803c))
* projectRoot passed to vecLib was malformed ([#1250](https://github.com/aws/language-servers/issues/1250)) ([def522d](https://github.com/aws/language-servers/commit/def522daee62ea37556fefe12352ef28f38523d1))
* removing warning icon for shell commands ([#1233](https://github.com/aws/language-servers/issues/1233)) ([18b2a18](https://github.com/aws/language-servers/commit/18b2a183ddeb3b58e3ebc9931cea08c1cf781bb7))
* server side timeout causes ISE ([#1254](https://github.com/aws/language-servers/issues/1254)) ([9cb2440](https://github.com/aws/language-servers/commit/9cb2440c165a296e11e0597e14b6c6aa7205f313))
* show context transparency list when using [@workspace](https://github.com/workspace) ([#1241](https://github.com/aws/language-servers/issues/1241)) ([291c0ba](https://github.com/aws/language-servers/commit/291c0ba945f311f6c1c071d048792de8735d17b8))
* switch to ignore entries over patterns ([#1236](https://github.com/aws/language-servers/issues/1236)) ([49ae714](https://github.com/aws/language-servers/commit/49ae7141024f9802d3ce671441f978f487a399aa))
* typo in cwsprChatTimeToFirstChunk and remove all zeros ([#1222](https://github.com/aws/language-servers/issues/1222)) ([4c940bc](https://github.com/aws/language-servers/commit/4c940bc20a3417e39d66ea73532f99a312d05e35))
* update header ignore status ([#1239](https://github.com/aws/language-servers/issues/1239)) ([6abf2fd](https://github.com/aws/language-servers/commit/6abf2fd27e8702a89f1ab306f363e04dfa27b978))
* update listDirectory tool to output in tree-like format to reduce toolSize ([#1260](https://github.com/aws/language-servers/issues/1260)) ([becfee0](https://github.com/aws/language-servers/commit/becfee0d36e9e2a5fb5239c1e34cc6661ca01d94))
* update reject button status ([#1253](https://github.com/aws/language-servers/issues/1253)) ([78c12c8](https://github.com/aws/language-servers/commit/78c12c8620367ac4276fb564e28ca58292cc8456))
* update undo-all-changes button icon to undo ([#1238](https://github.com/aws/language-servers/issues/1238)) ([6ebd5eb](https://github.com/aws/language-servers/commit/6ebd5eb8896a487189b79b1bbf1612ec9e95d064))
* use proper condition for trigger index enablement response ([#1258](https://github.com/aws/language-servers/issues/1258)) ([5aeb694](https://github.com/aws/language-servers/commit/5aeb694f495b8365c958bc9b626d0daf11718458))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @aws/lsp-core bumped from ^0.0.5 to ^0.0.6

## [0.0.35](https://github.com/aws/language-servers/compare/lsp-codewhisperer/v0.0.34...lsp-codewhisperer/v0.0.35) (2025-05-06)


### Bug Fixes

* emit all errors to get total # of errors ([#1252](https://github.com/aws/language-servers/issues/1252)) ([b425a66](https://github.com/aws/language-servers/commit/b425a667082e67a20e6f265cb0e41d049d5149af))
* hide non-user-generated messages when reloading history ([#1257](https://github.com/aws/language-servers/issues/1257)) ([9540f12](https://github.com/aws/language-servers/commit/9540f12c7d9495b481d0cf61ad2b2c0b8339f156))
* make LLM less apologetic, increase listDirectory result size ([#1242](https://github.com/aws/language-servers/issues/1242)) ([572cabb](https://github.com/aws/language-servers/commit/572cabb1036171438fe97898f72c85383628bcfd))
* projectRoot passed to vecLib was malformed ([#1250](https://github.com/aws/language-servers/issues/1250)) ([def522d](https://github.com/aws/language-servers/commit/def522daee62ea37556fefe12352ef28f38523d1))
* server side timeout causes ISE ([#1254](https://github.com/aws/language-servers/issues/1254)) ([9cb2440](https://github.com/aws/language-servers/commit/9cb2440c165a296e11e0597e14b6c6aa7205f313))
* show context transparency list when using [@workspace](https://github.com/workspace) ([#1241](https://github.com/aws/language-servers/issues/1241)) ([291c0ba](https://github.com/aws/language-servers/commit/291c0ba945f311f6c1c071d048792de8735d17b8))
* switch to ignore entries over patterns ([#1236](https://github.com/aws/language-servers/issues/1236)) ([49ae714](https://github.com/aws/language-servers/commit/49ae7141024f9802d3ce671441f978f487a399aa))
* update header ignore status ([#1239](https://github.com/aws/language-servers/issues/1239)) ([6abf2fd](https://github.com/aws/language-servers/commit/6abf2fd27e8702a89f1ab306f363e04dfa27b978))
* update reject button status ([#1253](https://github.com/aws/language-servers/issues/1253)) ([78c12c8](https://github.com/aws/language-servers/commit/78c12c8620367ac4276fb564e28ca58292cc8456))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @aws/lsp-core bumped from ^0.0.4 to ^0.0.5

## [0.0.34](https://github.com/aws/language-servers/compare/lsp-codewhisperer/v0.0.33...lsp-codewhisperer/v0.0.34) (2025-05-02)


### Features

* add request id to default log level ([#1221](https://github.com/aws/language-servers/issues/1221)) ([fe31f26](https://github.com/aws/language-servers/commit/fe31f266eb481d9899c4924f878fe49f6bfe94aa))
* **amazonq:** add error code handling for transformation jobs ([#1174](https://github.com/aws/language-servers/issues/1174)) ([634587c](https://github.com/aws/language-servers/commit/634587c93f08315f0676608b6f8687d309104cac))


### Bug Fixes

* add support for determing workspace folder with root uri/path on initialize ([#1210](https://github.com/aws/language-servers/issues/1210)) ([5fd3174](https://github.com/aws/language-servers/commit/5fd3174f386fd0e97b8f631d26f457f574d145c4))
* fix for permission case for execute bash ([66612cd](https://github.com/aws/language-servers/commit/66612cd5fe625dba6d951bc300e538e896e5f392))
* fix for permission case for execute bash ([#1220](https://github.com/aws/language-servers/issues/1220)) ([66612cd](https://github.com/aws/language-servers/commit/66612cd5fe625dba6d951bc300e538e896e5f392))
* fix the extra line on executeBash and wrong warning msg for outside workspace ([#1240](https://github.com/aws/language-servers/issues/1240)) ([eacc047](https://github.com/aws/language-servers/commit/eacc0475f2fe0362c155a2bd6be1715b2561d356))
* only keep toolUses with `stop` = true in history ([#1235](https://github.com/aws/language-servers/issues/1235)) ([1edb6af](https://github.com/aws/language-servers/commit/1edb6af0425a3613d7dccb795b7d8178bf1c803c))
* removing warning icon for shell commands ([#1233](https://github.com/aws/language-servers/issues/1233)) ([18b2a18](https://github.com/aws/language-servers/commit/18b2a183ddeb3b58e3ebc9931cea08c1cf781bb7))
* typo in cwsprChatTimeToFirstChunk and remove all zeros ([#1222](https://github.com/aws/language-servers/issues/1222)) ([4c940bc](https://github.com/aws/language-servers/commit/4c940bc20a3417e39d66ea73532f99a312d05e35))
* update undo-all-changes button icon to undo ([#1238](https://github.com/aws/language-servers/issues/1238)) ([6ebd5eb](https://github.com/aws/language-servers/commit/6ebd5eb8896a487189b79b1bbf1612ec9e95d064))

## [0.0.33](https://github.com/aws/language-servers/compare/lsp-codewhisperer/v0.0.32...lsp-codewhisperer/v0.0.33) (2025-05-01)


### Features

* add [@workspace](https://github.com/workspace) context in agentic chat ([#1029](https://github.com/aws/language-servers/issues/1029)) ([f2916f4](https://github.com/aws/language-servers/commit/f2916f45c351a42a9951ff00bcb7f7eed3ce7274))
* add cancellation handling to tools ([#1057](https://github.com/aws/language-servers/issues/1057)) ([f2ea9ac](https://github.com/aws/language-servers/commit/f2ea9ac349dbd2825ca8e6934f44c1270653dc61))
* add configurable file indexing logic ([#967](https://github.com/aws/language-servers/issues/967)) ([dd49420](https://github.com/aws/language-servers/commit/dd49420beeae58d6a425b192dffd3f59f6b1bb7b))
* add context related telemetry to add message ([#1180](https://github.com/aws/language-servers/issues/1180)) ([18eff11](https://github.com/aws/language-servers/commit/18eff11bc1c1dcfdd65e20a70534161492d3e0fe))
* add enablerazorviewtransform ([527ae03](https://github.com/aws/language-servers/commit/527ae03521642e9b6940f3ba71ca61327d8d28b8))
* add explanation text as directive ([#1054](https://github.com/aws/language-servers/issues/1054)) ([a0ca8e0](https://github.com/aws/language-servers/commit/a0ca8e0059a26ac7f21e04940ad120c3de268df9))
* add file search tool ([#1103](https://github.com/aws/language-servers/issues/1103)) ([91bfef8](https://github.com/aws/language-servers/commit/91bfef83d167ab8271b48ff1e499331b667fd818))
* add IAM Q Streaming Client to language-servers ([#927](https://github.com/aws/language-servers/issues/927)) ([ef89fdf](https://github.com/aws/language-servers/commit/ef89fdf228f4799a29a22a60dc105ade4ee99ab3))
* add iam support in q chat server and q agentic server ([#945](https://github.com/aws/language-servers/issues/945)) ([2ac19b7](https://github.com/aws/language-servers/commit/2ac19b76731cb07bd7a5621c049b9c9ff18a8d45))
* add ide category to auto-trigger threshold computation ([#1104](https://github.com/aws/language-servers/issues/1104)) ([28161f9](https://github.com/aws/language-servers/commit/28161f97873af931307d6a19ea1e25ea5aa6ed3b))
* add LSP based tools for listing files, file contents, and updating files ([33fbf03](https://github.com/aws/language-servers/commit/33fbf03c9065deaf86ccf9f859b731fc8d3f6026))
* add mcp client ([#1034](https://github.com/aws/language-servers/issues/1034)) ([626b126](https://github.com/aws/language-servers/commit/626b126598c20fa6589ccf25b75c9d661728dca4))
* add permission check for all tools and add UI permission cards ([6194a75](https://github.com/aws/language-servers/commit/6194a7565bc86d09c589b2c0b9117f4823abe89e))
* add permission check for all tools and add UI permission cards ([#1078](https://github.com/aws/language-servers/issues/1078)) ([6194a75](https://github.com/aws/language-servers/commit/6194a7565bc86d09c589b2c0b9117f4823abe89e))
* add prevalidation step for request ([#1208](https://github.com/aws/language-servers/issues/1208)) ([de154a6](https://github.com/aws/language-servers/commit/de154a6e24cb393fc9ae980addb23a61509e87f6))
* add proper windows support for executeBash and remove mocks in tests. ([#934](https://github.com/aws/language-servers/issues/934)) ([148062f](https://github.com/aws/language-servers/commit/148062f51d9ef54fdce7be5658bb878b6a9fccc7))
* add stop button for execute bash ([#1150](https://github.com/aws/language-servers/issues/1150)) ([9cf2013](https://github.com/aws/language-servers/commit/9cf2013d30434a8a03f2497fc9b1e2a727c33918))
* add text based tool updates for agentic-chat ([#984](https://github.com/aws/language-servers/issues/984)) ([12dc8d7](https://github.com/aws/language-servers/commit/12dc8d767be42d04d50303143e1a551fb103bdc5))
* add the code search tool to support semantic search in the workspacke ([#1151](https://github.com/aws/language-servers/issues/1151)) ([d2105cd](https://github.com/aws/language-servers/commit/d2105cddbd2fee5c45c4773bc2d49d45eae1b119))
* add the grepSearch tool ([#1109](https://github.com/aws/language-servers/issues/1109)) ([6016264](https://github.com/aws/language-servers/commit/601626428b6ac968fe85257a09478e94263a5a1e))
* add tools to request in agentic chat controller and log tool usages ([39e9472](https://github.com/aws/language-servers/commit/39e947286e64d80677d231b87cf62acab16e756b))
* added icons to help and clear action ([#942](https://github.com/aws/language-servers/issues/942)) ([694bbb8](https://github.com/aws/language-servers/commit/694bbb85580cc79313d65ad77b224875f74280c2))
* added support for injecting additional context commands ([#1045](https://github.com/aws/language-servers/issues/1045)) ([d755da3](https://github.com/aws/language-servers/commit/d755da36bd7bf76684aceafb6a2cbc2f8f76291e))
* allow backend errors to be handled seperately ([#1167](https://github.com/aws/language-servers/issues/1167)) ([4c828d4](https://github.com/aws/language-servers/commit/4c828d40611e4354a17ff60179bca57ff9f2bb33))
* allow generateAssistantResponse throughout chatSession and triggerContext ([091f99f](https://github.com/aws/language-servers/commit/091f99f6535de981efecc7b07337e027432a35e2))
* **amazonq:** add auth follow up for pending profile selection ([#935](https://github.com/aws/language-servers/issues/935)) ([34a75ef](https://github.com/aws/language-servers/commit/34a75ef62c49ea6323104902f6485803155d57c6))
* **amazonq:** add pair programming toggle ([#1013](https://github.com/aws/language-servers/issues/1013)) ([7266d32](https://github.com/aws/language-servers/commit/7266d32b2fb73ead40abecb22749a2c9e5206a2a))
* **amazonq:** centralize configuration handling to base service manager class ([#906](https://github.com/aws/language-servers/issues/906)) ([b3aa8fa](https://github.com/aws/language-servers/commit/b3aa8fa54c7b13144fd8a924b1ad6e4f4a25fca4))
* **amazonq:** chat history and conversation persistence ([#941](https://github.com/aws/language-servers/issues/941)) ([bf944e0](https://github.com/aws/language-servers/commit/bf944e08e6044eb286a16ba451e70dbc5d88837a))
* **amazonq:** implement shared q service server ([#1052](https://github.com/aws/language-servers/issues/1052)) ([0eef371](https://github.com/aws/language-servers/commit/0eef371e24b0a098e861a598f7afa40077eebcdf))
* **amazonq:** initial implementation of read/list chat result ([#1024](https://github.com/aws/language-servers/issues/1024)) ([890e45e](https://github.com/aws/language-servers/commit/890e45eae48930370089936880c77b10edb83059))
* **amazonq:** initial UI for execute bash chat message ([#1041](https://github.com/aws/language-servers/issues/1041)) ([b3ed518](https://github.com/aws/language-servers/commit/b3ed518f27251742c392138f05b02281dfcddcac))
* **amazonq:** integrate with local context server ([71f4a44](https://github.com/aws/language-servers/commit/71f4a4465ab80264563f83f99fdc3ab0f0241d0b))
* **amazonq:** support context commands in agentic chat ([#948](https://github.com/aws/language-servers/issues/948)) ([71f4a44](https://github.com/aws/language-servers/commit/71f4a4465ab80264563f83f99fdc3ab0f0241d0b))
* cancel transformation polling when region is changed ([#1077](https://github.com/aws/language-servers/issues/1077)) ([99dd29c](https://github.com/aws/language-servers/commit/99dd29c16f9eb882ab298231db239233042a63c3))
* **chat-client:** implement export conversation flow ([#944](https://github.com/aws/language-servers/issues/944)) ([63fd2dc](https://github.com/aws/language-servers/commit/63fd2dc773e742c47040fd66aac4912664d91dd0))
* enable different variants in tool usage, inputs, and results ([0707d86](https://github.com/aws/language-servers/commit/0707d866893052ebcf15d9b205304852f19a555b))
* enable inline project context in suggestion requests ([#983](https://github.com/aws/language-servers/issues/983)) ([501d3fe](https://github.com/aws/language-servers/commit/501d3fe01b44aa04bebd41e3ce0ad8a921756c11))
* enable inline project context in suggestion requests ([#993](https://github.com/aws/language-servers/issues/993)) ([b6d0e25](https://github.com/aws/language-servers/commit/b6d0e250f021f776e3b4d609823f072f302a476d))
* expose configuration for GPU acceleration and index worker threads in context server ([#960](https://github.com/aws/language-servers/issues/960)) ([0ecb9dd](https://github.com/aws/language-servers/commit/0ecb9dd6782b1b22e8031613d99c87a05dd2a6ab))
* extend logging utilts to support errors ([03c5bdd](https://github.com/aws/language-servers/commit/03c5bdd7f9861a222c21ce4a6594d1cc7b39d217))
* fsWrite undo button ([#1053](https://github.com/aws/language-servers/issues/1053)) ([e5d2f6a](https://github.com/aws/language-servers/commit/e5d2f6a952d8ed0ad01223e05446cb87d4c6d406))
* improve symlink handling ([#998](https://github.com/aws/language-servers/issues/998)) ([db917b3](https://github.com/aws/language-servers/commit/db917b348e50124ee976998f1ab3e36777868ad0))
* increase file limit and move to relevantTextDocument ([#1200](https://github.com/aws/language-servers/issues/1200)) ([ed9454a](https://github.com/aws/language-servers/commit/ed9454a507dbf917402208eb06548676119b4901))
* initial fsWrite chat message ([#1026](https://github.com/aws/language-servers/issues/1026)) ([3fc6e85](https://github.com/aws/language-servers/commit/3fc6e85e14614a86982b9fb85317c923784a05af))
* initial support for local project context ([#949](https://github.com/aws/language-servers/issues/949)) ([1318d29](https://github.com/aws/language-servers/commit/1318d294307d77ffd43e70828afb98788b871295))
* loop until the model does no longer return tool usages ([4f2eb3c](https://github.com/aws/language-servers/commit/4f2eb3c03182a9aea8b7682a959afb820fa9d0dd))
* open use input prompt for agentic chat and new prompt should stop current response ([90007d0](https://github.com/aws/language-servers/commit/90007d0b05fe8d7415748ea6e539e9d307583970))
* port executeBash tool from VSC ([#912](https://github.com/aws/language-servers/issues/912)) ([1ccba58](https://github.com/aws/language-servers/commit/1ccba58a9e339ab7d5e4370cf40fa7268f802fd8))
* port listDirectory from VSC ([#930](https://github.com/aws/language-servers/issues/930)) ([7feb127](https://github.com/aws/language-servers/commit/7feb127f33570d2349852781e16cc9d6763a92b8))
* remove fileSearch and codeSearch tools from Amazon Q language server ([#1160](https://github.com/aws/language-servers/issues/1160)) ([456225f](https://github.com/aws/language-servers/commit/456225f87e0333ec807aa132ea8ba2e5a1b3b588))
* render additional chat messages ([#1025](https://github.com/aws/language-servers/issues/1025)) ([3a87baa](https://github.com/aws/language-servers/commit/3a87baa96cacba40f3fa920e4a02d26aa01a7058))
* route button event through chat-client.  ([#1037](https://github.com/aws/language-servers/issues/1037)) ([c6bb6c5](https://github.com/aws/language-servers/commit/c6bb6c5e81f0c639657e36e1989f6bae3ef47f38))
* send chat update on undo ([#1068](https://github.com/aws/language-servers/issues/1068)) ([c965db2](https://github.com/aws/language-servers/commit/c965db2b3a723b3a5b430f496819b8b424dcaf95))
* show agentLoop error in chat ([#1169](https://github.com/aws/language-servers/issues/1169)) ([a7bfc1a](https://github.com/aws/language-servers/commit/a7bfc1a0da42392a26fe07ba5918c1d7d761de86))
* show customer facing message for inputTooLong error ([#1175](https://github.com/aws/language-servers/issues/1175)) ([0ad66a2](https://github.com/aws/language-servers/commit/0ad66a2619bfa16091aeef88c7b43e31b5d5c3d6))
* stream the execute bash output ([#1083](https://github.com/aws/language-servers/issues/1083)) ([0ea098b](https://github.com/aws/language-servers/commit/0ea098b27844691e52d58199ab585929284bf79e))
* support file snapshot for diffs ([#1138](https://github.com/aws/language-servers/issues/1138)) ([7040a1c](https://github.com/aws/language-servers/commit/7040a1cdfc57a27a9a437d4db1439a8b24740258))
* support for project context in Q Chat ([#1061](https://github.com/aws/language-servers/issues/1061)) ([#1101](https://github.com/aws/language-servers/issues/1101)) ([392a31d](https://github.com/aws/language-servers/commit/392a31d2e7adc6eb0bd08ae9aa28d4a1eac3119d))
* support generateAssistantResponse as well as sendMessage ([a96f864](https://github.com/aws/language-servers/commit/a96f86444147757f20cc1fd033b018a12c915622))
* support view diff for fsWrite ([#1042](https://github.com/aws/language-servers/issues/1042)) ([98291cb](https://github.com/aws/language-servers/commit/98291cb62a43176ec176bcdd92aa7746d08b9740))
* undo-all button ([#1153](https://github.com/aws/language-servers/issues/1153)) ([82ffd10](https://github.com/aws/language-servers/commit/82ffd106b550bc314f46d52ffb30470316022825))
* update confirm header after button click WIP ([#1062](https://github.com/aws/language-servers/issues/1062)) ([f396bd6](https://github.com/aws/language-servers/commit/f396bd658df4200b595cd62687d2ed19ef68ec58))
* use enableLocalIndexing to control actual indexing ([#1201](https://github.com/aws/language-servers/issues/1201)) ([dbf99af](https://github.com/aws/language-servers/commit/dbf99af8c2ec943130472cbab1372a544b14093a))
* workspace open settings ([#1055](https://github.com/aws/language-servers/issues/1055)) ([f3018da](https://github.com/aws/language-servers/commit/f3018da706663b0f64bc5b4becc2fd600d5ff5b6))


### Bug Fixes

* add code reference to response stream ([#1217](https://github.com/aws/language-servers/issues/1217)) ([5938402](https://github.com/aws/language-servers/commit/5938402ea7608a60286c80e151ef6e3639dbef39))
* add file list card separate from permission card for tool execut… ([#1129](https://github.com/aws/language-servers/issues/1129)) ([e9b654e](https://github.com/aws/language-servers/commit/e9b654ecd5ba998e57fc67ae61278a9a497e060a))
* add file list card separate from permission card for tool executions outside workspace ([e9b654e](https://github.com/aws/language-servers/commit/e9b654ecd5ba998e57fc67ae61278a9a497e060a))
* add formatChatHistoryMessage to chatDb ([#1110](https://github.com/aws/language-servers/issues/1110)) ([353843a](https://github.com/aws/language-servers/commit/353843a6467adf63b43cbc9262d7067ebfac2cd3))
* add history to request on each chat prompt ([e9589cd](https://github.com/aws/language-servers/commit/e9589cd67fc9a47b4e3a36490f43347d913c71ff))
* add onTabBarAction and getSerializedChat to Omit list of Chat handlers temporarily ([#961](https://github.com/aws/language-servers/issues/961)) ([573588c](https://github.com/aws/language-servers/commit/573588c2929b97594660d6b256f1c6353bc8c2bc))
* add profileArn for STE and fix timeBetweenChunks ([#1189](https://github.com/aws/language-servers/issues/1189)) ([9285b75](https://github.com/aws/language-servers/commit/9285b75e63e3bf9516906f10efacde7c50efc0c0))
* add result attribute when emitting amazonq_toolUseSuggested telemetry ([#1107](https://github.com/aws/language-servers/issues/1107)) ([d882b18](https://github.com/aws/language-servers/commit/d882b188bfdf09d40340d59190839df3acde8e41))
* add result attribute when emitting telemetry event ([#1088](https://github.com/aws/language-servers/issues/1088)) ([90007d0](https://github.com/aws/language-servers/commit/90007d0b05fe8d7415748ea6e539e9d307583970))
* add result field for agentic chat interaction telemetry ([84ba395](https://github.com/aws/language-servers/commit/84ba39596b6240aa71d19e73e15858013dd01e18))
* add workspace folders as context for agentic-chat ([#995](https://github.com/aws/language-servers/issues/995)) ([f300ca5](https://github.com/aws/language-servers/commit/f300ca5acae03a993114c31d0b88d88b6cd26dc4))
* added/deleted lines is incorrect ([#1044](https://github.com/aws/language-servers/issues/1044)) ([294bfec](https://github.com/aws/language-servers/commit/294bfec899e2b208e960b718a2c2b7ae2e9db9ff))
* adding fixHistory logic for agentic Chat ([#1050](https://github.com/aws/language-servers/issues/1050)) ([4a7ad34](https://github.com/aws/language-servers/commit/4a7ad3441668d9c2103c68220ec2339c28b7b955))
* adding message if user clicks on stop button ([#1219](https://github.com/aws/language-servers/issues/1219)) ([50de37d](https://github.com/aws/language-servers/commit/50de37d6ab3d6d91fcb180653ef9b9e35869d517))
* adding tooltip description to filePaths ([#1136](https://github.com/aws/language-servers/issues/1136)) ([a0bdf7d](https://github.com/aws/language-servers/commit/a0bdf7d6e17c042c6882859b8fea85161140753a))
* addtional case for error metric and emit languageServerVersion ([#1143](https://github.com/aws/language-servers/issues/1143)) ([911ddea](https://github.com/aws/language-servers/commit/911ddea52e061697d631ddbae9a283aa146c5131))
* **agenticChat:** Only show the file name in chat ([#1080](https://github.com/aws/language-servers/issues/1080)) ([dd9c2b5](https://github.com/aws/language-servers/commit/dd9c2b5167e5bb2505d2658b4783f67a8fce29eb))
* allowing access to a folder should implicitly give access to sub folders ([#1170](https://github.com/aws/language-servers/issues/1170)) ([d589c11](https://github.com/aws/language-servers/commit/d589c11c1be053c2c96b36d2541833262f852d44))
* allowing read access to a folder should implicitly give read access to all subfolders ([d589c11](https://github.com/aws/language-servers/commit/d589c11c1be053c2c96b36d2541833262f852d44))
* also remove loading if execute failed ([#1096](https://github.com/aws/language-servers/issues/1096)) ([08a5d31](https://github.com/aws/language-servers/commit/08a5d31de1c79b9e936d7a29da0e467c1d0997af))
* **amazonq:** add cancel support to loading developer profiles ([#940](https://github.com/aws/language-servers/issues/940)) ([d07f79a](https://github.com/aws/language-servers/commit/d07f79a54d259024d0e8331122d718ee0b461864))
* **amazonq:** add missing paginator to list profiles call ([#938](https://github.com/aws/language-servers/issues/938)) ([0435c80](https://github.com/aws/language-servers/commit/0435c80b05fd3c7065da7f831e1e2d9281da0b2e))
* **amazonq:** add regionalization support to .NET Transform server ([#952](https://github.com/aws/language-servers/issues/952)) ([7571ffd](https://github.com/aws/language-servers/commit/7571ffdb87662698da0c086dad18a9db4947ce08))
* **amazonq:** add validation for create a saved prompt UX ([#1116](https://github.com/aws/language-servers/issues/1116)) ([a72d4d2](https://github.com/aws/language-servers/commit/a72d4d2cf2df883ae3c4b143b65d1373433a4b58))
* **amazonq:** avoid double rendering on confirmation. ([#1067](https://github.com/aws/language-servers/issues/1067)) ([e9e63b5](https://github.com/aws/language-servers/commit/e9e63b5e67d4122547cf4599d3d5a0af070e4029))
* **amazonq:** avoid ERR_UNSUPPORTED_ESM_URL_SCHEME error when loading indexer on Windows ([#1135](https://github.com/aws/language-servers/issues/1135)) ([e1f403f](https://github.com/aws/language-servers/commit/e1f403f5d35a268b782b256a2901c4b3a775ac0c))
* **amazonq:** Code items show symbol name instead of file name ([#1157](https://github.com/aws/language-servers/issues/1157)) ([a21ec17](https://github.com/aws/language-servers/commit/a21ec17962189000fab5d7d269a8c409e049ecb8))
* **amazonq:** deduplicate files in context list ([#1120](https://github.com/aws/language-servers/issues/1120)) ([00cc54b](https://github.com/aws/language-servers/commit/00cc54b5f2d54a5783facfb5042635e3f1a5d288))
* **amazonq:** fetch profiles only for requested profile region when updating profile ([4793504](https://github.com/aws/language-servers/commit/4793504f10713f0685c1766fb0123172104e6f4c))
* **amazonq:** fix context transparency doesn't show for file & file c… ([#1015](https://github.com/aws/language-servers/issues/1015)) ([15c445a](https://github.com/aws/language-servers/commit/15c445aa30a6a94f114d1649d68ce3345c0d9ae7))
* **amazonq:** fixes and refactor ([71f4a44](https://github.com/aws/language-servers/commit/71f4a4465ab80264563f83f99fdc3ab0f0241d0b))
* **amazonq:** increase timeout for project index init ([#1005](https://github.com/aws/language-servers/issues/1005)) ([cf88282](https://github.com/aws/language-servers/commit/cf8828294d36c9459c199e888b43c37309a7f3f6))
* **amazonq:** move context command provider to agentic chat controller ([#999](https://github.com/aws/language-servers/issues/999)) ([0ad24d4](https://github.com/aws/language-servers/commit/0ad24d40e4b8bf50809db6cb4f4ceb00da4deb01))
* **amazonq:** recursively create directory for saved user prompts ([#1148](https://github.com/aws/language-servers/issues/1148)) ([94290cb](https://github.com/aws/language-servers/commit/94290cb1ea8668d76f37ae19d099d50717aff670))
* **amazonq:** workspace rules and saved prompts not working ([#1063](https://github.com/aws/language-servers/issues/1063)) ([ae67519](https://github.com/aws/language-servers/commit/ae67519904767cb1178e92a69906edadd0fd789f))
* bubble up throttling error for ListAvailableProfiles API to client ([#1127](https://github.com/aws/language-servers/issues/1127)) ([daca805](https://github.com/aws/language-servers/commit/daca805d06f731d2a5dd3f86172b86580cf0e69e))
* change in reject button placement in execute bash ([#1182](https://github.com/aws/language-servers/issues/1182)) ([7d36434](https://github.com/aws/language-servers/commit/7d36434e38012a13c18ba3481c3fd3da25b495f8))
* change log-level for request logs ([#1147](https://github.com/aws/language-servers/issues/1147)) ([26abff9](https://github.com/aws/language-servers/commit/26abff97c17816bc8c765535b673e65fca64671a))
* change PPM switch info text cards ([c8c7d05](https://github.com/aws/language-servers/commit/c8c7d056a571bc407d029345d19de9f7709e181f))
* chat response in windows uses mac-like path/command ([#1166](https://github.com/aws/language-servers/issues/1166)) ([80d5e82](https://github.com/aws/language-servers/commit/80d5e82645986d464821cdab0c5aa35da8e1c44a))
* **chat-client:** disable click event for empty history list item ([#973](https://github.com/aws/language-servers/issues/973)) ([bc20a04](https://github.com/aws/language-servers/commit/bc20a04277a7b603e0d0c5e623c87b2a5c4dc4d4))
* **chat-client:** fix the warning icon ([#1126](https://github.com/aws/language-servers/issues/1126)) ([c3ecda6](https://github.com/aws/language-servers/commit/c3ecda6317d2b78bac03d2fb4b3b6b011763cd00))
* **chat-client:** return message for rejecting command ([#1140](https://github.com/aws/language-servers/issues/1140)) ([db90ec0](https://github.com/aws/language-servers/commit/db90ec0f65689377bd5e9684d50b06b7b90472f5))
* **chat-client:** workspace checks for permission cards ([#1089](https://github.com/aws/language-servers/issues/1089)) ([bdecb10](https://github.com/aws/language-servers/commit/bdecb1095b1a19b5d09f20d7f7762aabcb4090ca))
* ci failing due to invalid argument ([#1198](https://github.com/aws/language-servers/issues/1198)) ([47c0c84](https://github.com/aws/language-servers/commit/47c0c846f1da587701accb4a82f992700ee1aa57))
* clicking files on Windows doesn't work ([#1168](https://github.com/aws/language-servers/issues/1168)) ([9d50420](https://github.com/aws/language-servers/commit/9d5042041db6342f33b03a94ef463ff1277b016f))
* context transparency list not displayed ([#1095](https://github.com/aws/language-servers/issues/1095)) ([9919654](https://github.com/aws/language-servers/commit/9919654baf1625eeba3c2023028811b947495809))
* disable timeout for tests in aws-lsp-codewhisperer and core packages ([#955](https://github.com/aws/language-servers/issues/955)) ([254e36c](https://github.com/aws/language-servers/commit/254e36cf1a34b114a9397c688784293367dc1d63))
* do not include references in request history ([#1066](https://github.com/aws/language-servers/issues/1066)) ([55cf8d1](https://github.com/aws/language-servers/commit/55cf8d1ef577210d06dbaf959857c046342e1966))
* don't crash if local indexing controller does not start in 60 seconds ([1457cb3](https://github.com/aws/language-servers/commit/1457cb3e3be1b2ae9b835f7df977e4c6a9f93f82))
* duplicate explanation ([#1186](https://github.com/aws/language-servers/issues/1186)) ([8a92df7](https://github.com/aws/language-servers/commit/8a92df708dc8650e82bb42ee105821f201d77139))
* ensure chat history consistency by fixing database state before each request ([#1082](https://github.com/aws/language-servers/issues/1082)) ([eac472a](https://github.com/aws/language-servers/commit/eac472a60250f0baa43e8d327ee64096d5807aa2))
* error message metric now correctly emitted ([#1123](https://github.com/aws/language-servers/issues/1123)) ([79043df](https://github.com/aws/language-servers/commit/79043df47c3c2ad0cdd3d38d75f455354175d409))
* execute bash output formatting ([#1121](https://github.com/aws/language-servers/issues/1121)) ([c3fd570](https://github.com/aws/language-servers/commit/c3fd5703f0a95c79b9b074f2184a0ffc52c13a7e))
* execute command should show when no approval required & add more loading ([#1091](https://github.com/aws/language-servers/issues/1091)) ([5c48989](https://github.com/aws/language-servers/commit/5c48989d18665b84578b9c4bc49a5f3928754619))
* extra thinking in the end ([#1146](https://github.com/aws/language-servers/issues/1146)) ([6708413](https://github.com/aws/language-servers/commit/670841357d68fa49f1f792bd9936f2421410458d))
* falcon context file clicks ([#1094](https://github.com/aws/language-servers/issues/1094)) ([d68d148](https://github.com/aws/language-servers/commit/d68d1486cb2a563b153c967112a0eada0cc772df))
* fallback to fs if document context fails to sync ([#1017](https://github.com/aws/language-servers/issues/1017)) ([69db2bd](https://github.com/aws/language-servers/commit/69db2bd8dd631af226c5c96115e4102825019b0c))
* file should be grey out and unclickable after undo ([#1184](https://github.com/aws/language-servers/issues/1184)) ([120bdc5](https://github.com/aws/language-servers/commit/120bdc563a39718f0639e19da25fb38323495e03))
* fix execute bash test command failing on pipeline ([#956](https://github.com/aws/language-servers/issues/956)) ([461957d](https://github.com/aws/language-servers/commit/461957dc7856ca3490ccdd756e6dd4cb1351698c))
* fix execute command header flickering issue ([#1177](https://github.com/aws/language-servers/issues/1177)) ([dc5d360](https://github.com/aws/language-servers/commit/dc5d36029102f845617ed791f252e115fef57686))
* fix for context list flickering ux ([#1181](https://github.com/aws/language-servers/issues/1181)) ([a7fc6fe](https://github.com/aws/language-servers/commit/a7fc6fe1acb35b1257f98e5b426b5ee3437716e1))
* fix header incorrectly added to other message issue ([dc5d360](https://github.com/aws/language-servers/commit/dc5d36029102f845617ed791f252e115fef57686))
* fix ppm mode switch texts ([#1196](https://github.com/aws/language-servers/issues/1196)) ([c8c7d05](https://github.com/aws/language-servers/commit/c8c7d056a571bc407d029345d19de9f7709e181f))
* fix project root not passed to buildIndex ([3237ffe](https://github.com/aws/language-servers/commit/3237ffef10f4b57cda600397343cbc1e6d40ec38))
* fix the context list bug and show the tooltip ([c2d61f4](https://github.com/aws/language-servers/commit/c2d61f42214c8a55354f54f1300252acfab3481b))
* Fixes the issue of collapsing the files and folders while streaming response. ([#1161](https://github.com/aws/language-servers/issues/1161)) ([8d8521b](https://github.com/aws/language-servers/commit/8d8521bbec0e9bf068bef34fac45f224c0ca9b05))
* format objects in the logs properly. ([#1139](https://github.com/aws/language-servers/issues/1139)) ([1ff522c](https://github.com/aws/language-servers/commit/1ff522c7005bae518cf8ae3ed80a0faa82d11435))
* further improvements for thinking/loading ([#1125](https://github.com/aws/language-servers/issues/1125)) ([5e091d7](https://github.com/aws/language-servers/commit/5e091d704cbd3dd4cd3a2a97f0234f029cc49247))
* handle indexing library import when require.main is undefined ([#982](https://github.com/aws/language-servers/issues/982)) ([f5dac38](https://github.com/aws/language-servers/commit/f5dac38c03585ee5001beddbccd8a184bb48c5a7))
* handle undefined workspace folders in context controller ([#964](https://github.com/aws/language-servers/issues/964)) ([a01262c](https://github.com/aws/language-servers/commit/a01262cf0fc94134b6f00c9d2806c99796233551))
* hardcoded class and function names logging to avoid uglified naming when bundled ([#909](https://github.com/aws/language-servers/issues/909)) ([68e692a](https://github.com/aws/language-servers/commit/68e692a754a1262261e734a7ac85468e6470db17))
* history not persisted for agentic chat via IdC signin ([1d2ca01](https://github.com/aws/language-servers/commit/1d2ca018f2248106690438b860d40a7ee67ac728))
* implement proper error handling. ([#1115](https://github.com/aws/language-servers/issues/1115)) ([4a7bfdc](https://github.com/aws/language-servers/commit/4a7bfdc1402d6c0eaa1da23c61dc5559605e670a))
* improve chat rendering if there are additional chat messages ([#1039](https://github.com/aws/language-servers/issues/1039)) ([70a086a](https://github.com/aws/language-servers/commit/70a086a823fc56dcd068dee0fa3147cb06684b9a))
* increase information on request logs ([#1209](https://github.com/aws/language-servers/issues/1209)) ([469449e](https://github.com/aws/language-servers/commit/469449e10b03649384a16c469ee4909c78ed12d9))
* invalid json aborts the loop ([#1141](https://github.com/aws/language-servers/issues/1141)) ([222aee8](https://github.com/aws/language-servers/commit/222aee8bc1788f15d85527ca2469d978e2d9c790))
* isInWorkspace should work on closed files.  ([#1004](https://github.com/aws/language-servers/issues/1004)) ([a96651e](https://github.com/aws/language-servers/commit/a96651ea1edd296b5dfa7ee4fdd1c6d378a14858))
* keep falcon context in history ([d80fafd](https://github.com/aws/language-servers/commit/d80fafd74b3c76b0f8b9b19d58c5af66fd604c02))
* llm not breaking down requests when input is too large ([#1159](https://github.com/aws/language-servers/issues/1159)) ([f69bac5](https://github.com/aws/language-servers/commit/f69bac55ba25393f5383ba5622965ba43de4a187))
* loading appears too often ([#1179](https://github.com/aws/language-servers/issues/1179)) ([80aa92e](https://github.com/aws/language-servers/commit/80aa92e6b658fe07258bc3d04cb453656e69b7f7))
* log entire raw request ([#1218](https://github.com/aws/language-servers/issues/1218)) ([0662893](https://github.com/aws/language-servers/commit/066289332dd6fe2b3accde69c7076eb3b3ac8822))
* Make RemoveDuplicateNugetPackage failure a non-blocker for transformation ([29727e6](https://github.com/aws/language-servers/commit/29727e6fcd9f3c2a7bdc422419c549e29dbf9f20))
* metric to show tool distribution ([#1090](https://github.com/aws/language-servers/issues/1090)) ([bdf3019](https://github.com/aws/language-servers/commit/bdf3019c76ab32a73398478358f8bf977505b1db))
* more robust handling of file paths in context server ([#985](https://github.com/aws/language-servers/issues/985)) ([b2033d7](https://github.com/aws/language-servers/commit/b2033d756d52d1e8094c97203f1fe0952aa0162f))
* never leave body undefined in history, even if that assistant response did not have content ([1612eb0](https://github.com/aws/language-servers/commit/1612eb0ba1721b9b4a0e4813a5f037b2781ed0b0))
* new ignored status for execute bash tool ([#1203](https://github.com/aws/language-servers/issues/1203)) ([be135ec](https://github.com/aws/language-servers/commit/be135ec48afe3f50b918a33e90971c0531ac656e))
* onFileClick logic is crashing the whole process if no workspace is open ([#1119](https://github.com/aws/language-servers/issues/1119)) ([0211223](https://github.com/aws/language-servers/commit/0211223a93dd3ddcb5b7b06882e2a10eb09fa01c))
* output validation is incorrect for json output ([#1224](https://github.com/aws/language-servers/issues/1224)) ([fc3281f](https://github.com/aws/language-servers/commit/fc3281f17f06147b5ce41d41a5fe414a1df16bc4))
* pair programming mode toggle is not respected ([#1145](https://github.com/aws/language-servers/issues/1145)) ([2b11a55](https://github.com/aws/language-servers/commit/2b11a552f7cd4d23db2345f75a09d39fa960d5aa))
* parsing AmazonQWorkspaceConfiguration ([#996](https://github.com/aws/language-servers/issues/996)) ([5475521](https://github.com/aws/language-servers/commit/5475521d77880e82fd394dba0c345c3087787b64))
* polishing the read ux for file ([#1070](https://github.com/aws/language-servers/issues/1070)) ([e83d7ba](https://github.com/aws/language-servers/commit/e83d7ba3ac93e4af7f7524166bf1cb0f6d58f486))
* prevent double-writing executeBash command block on Reject button click ([#1087](https://github.com/aws/language-servers/issues/1087)) ([68df8f9](https://github.com/aws/language-servers/commit/68df8f9835471697687a75606c50796b193fc828))
* propagate errors from tools back to the model invocation ([d296091](https://github.com/aws/language-servers/commit/d2960913f886452742e5a4be6b18c9511595eaa3))
* reject button for executeBash tool ([#1133](https://github.com/aws/language-servers/issues/1133)) ([b498c6d](https://github.com/aws/language-servers/commit/b498c6d8992dcaeb8540e6a43df7965597a3fe56))
* reject should terminate agentic loop ([#1056](https://github.com/aws/language-servers/issues/1056)) ([befaeca](https://github.com/aws/language-servers/commit/befaecae91f01461c13a1ce7ce80deea4c4f805e))
* related tools in toolSpec causes hallucination ([#1187](https://github.com/aws/language-servers/issues/1187)) ([d8e433e](https://github.com/aws/language-servers/commit/d8e433eb5524228987d84b235bdf8f92dd6512aa))
* remove guessIntentFromPrompt functionality while preserving user Intent property ([#1156](https://github.com/aws/language-servers/issues/1156)) ([1108ff5](https://github.com/aws/language-servers/commit/1108ff52ef59de6ba135412d52a4f20a2a397ee9))
* remove loading when stop clicked and add loading when request in progress ([#1117](https://github.com/aws/language-servers/issues/1117)) ([40098dd](https://github.com/aws/language-servers/commit/40098ddc0277a1f29339b15d0950917143d2178b))
* request id and error message in error metric ([#1076](https://github.com/aws/language-servers/issues/1076)) ([84bccc6](https://github.com/aws/language-servers/commit/84bccc6055487df4d4cb30448dabc492f786f6a8))
* save ([#1035](https://github.com/aws/language-servers/issues/1035)) ([d115563](https://github.com/aws/language-servers/commit/d115563b96c41ae571fdf0d0525776ce83de9026))
* see if message is apart of agentic loop ([#1178](https://github.com/aws/language-servers/issues/1178)) ([a047be0](https://github.com/aws/language-servers/commit/a047be0207cb5f7b05e482c35d8cbe9f41dd0cfb))
* some chat messages are not added to history ([#1102](https://github.com/aws/language-servers/issues/1102)) ([0813bf3](https://github.com/aws/language-servers/commit/0813bf31a160e2213ec567ddae63e94690731111))
* stop button fix while waiting for permission check ([#1113](https://github.com/aws/language-servers/issues/1113)) ([a113a0d](https://github.com/aws/language-servers/commit/a113a0d6fa1558bcedacc182d66abc7159bbcdc1))
* stop button kills the shell executions ([1ff522c](https://github.com/aws/language-servers/commit/1ff522c7005bae518cf8ae3ed80a0faa82d11435))
* stop button kills the shell executions ([6597a5c](https://github.com/aws/language-servers/commit/6597a5c2a97bcd3449a075fc861642bb84f4bcd1))
* stop button kills the shell executions ([#1142](https://github.com/aws/language-servers/issues/1142)) ([6597a5c](https://github.com/aws/language-servers/commit/6597a5c2a97bcd3449a075fc861642bb84f4bcd1))
* telemetry for `@Files`, `@Folders`, `@Prompts`, `@Code` ([#1194](https://github.com/aws/language-servers/issues/1194)) ([c9c9f09](https://github.com/aws/language-servers/commit/c9c9f0930746bfb58af19c6150e2f4a004380728))
* telemetry for agentic chat interactions ([#1164](https://github.com/aws/language-servers/issues/1164)) ([9582275](https://github.com/aws/language-servers/commit/95822751b0e06eb85cad3d2698541d45eaa24c38))
* temporary fix for error where undefined is being passed to path.join ([#980](https://github.com/aws/language-servers/issues/980)) ([49e717c](https://github.com/aws/language-servers/commit/49e717cc22b67e954b2362c64a75945c3a6f72bb))
* thinking does not always appear ([#1152](https://github.com/aws/language-servers/issues/1152)) ([df231b9](https://github.com/aws/language-servers/commit/df231b9d73807d1696c3f7cdd474186dd8530b26))
* typo in response code metric field ([#1192](https://github.com/aws/language-servers/issues/1192)) ([57ca5bb](https://github.com/aws/language-servers/commit/57ca5bb162f7924ff071d26521bd7cac5f16cdcb))
* ui polish for execute confirmation ([#1072](https://github.com/aws/language-servers/issues/1072)) ([4539f21](https://github.com/aws/language-servers/commit/4539f21dd8232ef5b288771dda4d8ae25ebc5ffc))
* undo all appears between writes ([#1207](https://github.com/aws/language-servers/issues/1207)) ([2548d17](https://github.com/aws/language-servers/commit/2548d177fcc1b978100d6414a6f352492619386c))
* up the agent loop limit ([#1022](https://github.com/aws/language-servers/issues/1022)) ([0483fcb](https://github.com/aws/language-servers/commit/0483fcb6bb7411202d49b840253129892748ae3e))
* update context commands on file add/delete ([#1158](https://github.com/aws/language-servers/issues/1158)) ([b3b376e](https://github.com/aws/language-servers/commit/b3b376ea052444667d7d8e3db13664b158c6a59e))
* update dynamic import for vector library to avoid webpack resolution interference ([#1030](https://github.com/aws/language-servers/issues/1030)) ([6e6c229](https://github.com/aws/language-servers/commit/6e6c229eace97964685a33a7ea31119e306047f1))
* update fsWrite spec specify absolute path only ([#1008](https://github.com/aws/language-servers/issues/1008)) ([d1a2b62](https://github.com/aws/language-servers/commit/d1a2b628ca54edab376cf202355217bc69cf3abc))
* update fsWrite toolSpec ([#1064](https://github.com/aws/language-servers/issues/1064)) ([20e3680](https://github.com/aws/language-servers/commit/20e3680021cb6dd7f2dee70e5079b62aa3d209b4))
* update header on execute bash completion ([#1163](https://github.com/aws/language-servers/issues/1163)) ([72f7bef](https://github.com/aws/language-servers/commit/72f7bef68f7ba05241b766b0915bc007d7e83b7e))
* update spec to require absolute path ([#1009](https://github.com/aws/language-servers/issues/1009)) ([1e77b9f](https://github.com/aws/language-servers/commit/1e77b9f40946e5f623a609bdc5f76b121408f66a))
* update toolSpec for fsRead, fsWrite and listDirectory ([#1144](https://github.com/aws/language-servers/issues/1144)) ([1a5f745](https://github.com/aws/language-servers/commit/1a5f745f828f63e773165b58479d5ef513a04c0b))
* updated spacings through mynah-ui update ([#1214](https://github.com/aws/language-servers/issues/1214)) ([b8e8fab](https://github.com/aws/language-servers/commit/b8e8fab94c5d8b9b8ed4dacff8bb38de0a31750d))
* ux polish for list directory tool messages. ([#1075](https://github.com/aws/language-servers/issues/1075)) ([7cefc1f](https://github.com/aws/language-servers/commit/7cefc1f5dbcc7518e7b67b0de8f3204f12a74ea4))
* validate tool output content size ([#1111](https://github.com/aws/language-servers/issues/1111)) ([e22fd16](https://github.com/aws/language-servers/commit/e22fd1605142b1700060e5df20eaa55393dd116b))
* wrong path for file click uri ([#1059](https://github.com/aws/language-servers/issues/1059)) ([b6c16b4](https://github.com/aws/language-servers/commit/b6c16b4e6a0936fdb3c85430b73b05eb6c5acb64))


### Reverts

* enable inline project context in suggestion requests ([#991](https://github.com/aws/language-servers/issues/991)) ([9750a9f](https://github.com/aws/language-servers/commit/9750a9f5a106f25a2cc416d19a94bf8f74677d84))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @aws/lsp-core bumped from ^0.0.3 to ^0.0.4

## [0.0.32](https://github.com/aws/language-servers/compare/lsp-codewhisperer/v0.0.31...lsp-codewhisperer/v0.0.32) (2025-04-08)


### Bug Fixes

* pin typescript version and fix compile errors ([#924](https://github.com/aws/language-servers/issues/924)) ([7400fa3](https://github.com/aws/language-servers/commit/7400fa3d143fb2c22575485eec7aeb75a63b3612))

## [0.0.31](https://github.com/aws/language-servers/compare/lsp-codewhisperer/v0.0.30...lsp-codewhisperer/v0.0.31) (2025-04-07)


### Features

* Add support for inline chat ([#897](https://github.com/aws/language-servers/issues/897)) ([9fd97ea](https://github.com/aws/language-servers/commit/9fd97ea946712dbbd4490752d41c395d508c8d0c))
* **amazonq:** add streaming client caching and inflight-request cancellation ([#901](https://github.com/aws/language-servers/issues/901)) ([ecb323d](https://github.com/aws/language-servers/commit/ecb323dbd3835193c1f8478d797b6a37d89b5961))
* **amazonq:** optimize service manager reuse ([#886](https://github.com/aws/language-servers/issues/886)) ([84f46ef](https://github.com/aws/language-servers/commit/84f46ef88fbae72a246c3e966ee525124eb8915a))
* context data selection support in chat-client ([#902](https://github.com/aws/language-servers/issues/902)) ([a22dea5](https://github.com/aws/language-servers/commit/a22dea51c0039f198a403e88f774ad7769b15d29))
* port fs related tools from VSC.  ([#894](https://github.com/aws/language-servers/issues/894)) ([a368acc](https://github.com/aws/language-servers/commit/a368accfcd0b5c88b81f407d4cd7b73be2782b9b))
* update artifact manager for qct .net to include private package support ([#872](https://github.com/aws/language-servers/issues/872)) ([9c86cac](https://github.com/aws/language-servers/commit/9c86caceb2ebaf803d3e47ad257d49c8ab87bded))


### Bug Fixes

* **amazonq:** do not throw when receiving null profile while client not connected ([#908](https://github.com/aws/language-servers/issues/908)) ([a04eed1](https://github.com/aws/language-servers/commit/a04eed1d3527009d848c4d00d0860dc0adf70d80))
* **amazonq:** reduce noisy logging from Q Service Manager ([7ef13b5](https://github.com/aws/language-servers/commit/7ef13b585130e264f4fa9a2ba4fae2e923fb940a))
* for transformation failure with incorrect filePath while extracting ([#875](https://github.com/aws/language-servers/issues/875)) ([54310cc](https://github.com/aws/language-servers/commit/54310cc15a8cfb3d0eb44559f0d560bdd70581e5))
* handle large file uploads using streams ([#874](https://github.com/aws/language-servers/issues/874)) ([b5999aa](https://github.com/aws/language-servers/commit/b5999aa7c54addd4e6b92483a2bb28c2fe70ffa6))
* update null check for net core compatibility version and path for private package support ([#914](https://github.com/aws/language-servers/issues/914)) ([30a0d80](https://github.com/aws/language-servers/commit/30a0d80591dbe73fd54ad3783e0d75526d994af8))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @aws/lsp-core bumped from ^0.0.2 to ^0.0.3

## [0.0.30](https://github.com/aws/language-servers/compare/lsp-codewhisperer/v0.0.29...lsp-codewhisperer/v0.0.30) (2025-03-27)


### Features

* copied test files and added README to clarify purpose of this folder ([6a18e55](https://github.com/aws/language-servers/commit/6a18e55a1392aa9e68a202a8ca6f1a8b5c55bb4b))
* create copy of chat server and controller to use in agentic chat ([035b30e](https://github.com/aws/language-servers/commit/035b30ec98b85faad5696034e56dbafef67e7f79))


### Bug Fixes

* **amazonq:** select corrert Service manager mode in completion server factory ([8041934](https://github.com/aws/language-servers/commit/8041934de1021cfe570fc2686e4000749fe297a6))
* **amazonq:** use relative path of document with chat params ([#867](https://github.com/aws/language-servers/issues/867)) ([fbc667e](https://github.com/aws/language-servers/commit/fbc667e44767ca8ddcb743b9377bf1331a27fb29))

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
