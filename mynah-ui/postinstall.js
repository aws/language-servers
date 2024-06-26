const deprecationList = [
    'Config.texts.clickFileToViewDiff will be deprecated after 5.x.x',
    'MynahUIProps.onOpenDiff will be deprecated after 5.x.x',
    'MynahUIProps.onCodeInsertToCursorPosition will be deprecated after 5.x.x',
    'MynahUIProps.onCopyCodeToClipboard will be changed to be used only on keyboard and context menu copy actions after 5.x.x',
];

deprecationList.forEach(deprecationItem => console.log(deprecationItem));
