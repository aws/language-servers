const execSync = require('child_process').execSync
const fs = require('node:fs')

const pathToYamlPackage = require.resolve('yaml-language-server')
const rootPackage = pathToYamlPackage.substring(
    0,
    pathToYamlPackage.indexOf('node_modules/yaml-language-server/out/server/src/index.js')
)
const pathToFileHover = rootPackage + 'node_modules/yaml-language-server/lib/esm/languageservice/services/yamlHover.js'

const filePathToPatchPathMarkdown = {
    'node_modules/yaml-language-server/lib/esm/languageservice/services/yamlHover.js':
        'patches/markdown/yamlHover.esm.patch',
    'node_modules/yaml-language-server/lib/umd/languageservice/services/yamlHover.js':
        'patches/markdown/yamlHover.umd.patch',
    'node_modules/yaml-language-server/out/server/src/languageservice/services/yamlHover.js':
        'patches/markdown/yamlHover.src.patch',
    'node_modules/yaml-language-server/lib/esm/languageservice/yamlLanguageService.d.ts':
        'patches/markdown/yamlLanguageService.esm.patch',
    'node_modules/yaml-language-server/lib/umd/languageservice/yamlLanguageService.d.ts':
        'patches/markdown/yamlLanguageService.umd.patch',
    'node_modules/yaml-language-server/out/server/src/languageservice/yamlLanguageService.d.ts':
        'patches/markdown/yamlLanguageService.src.patch',
}

const filePathToPatchPathUnsafeEval = {
    'node_modules/yaml-language-server/lib/esm/languageservice/services/yamlSchemaService.js':
        'patches/unsafe-eval/yamlSchemaService.esm.patch',
    'node_modules/yaml-language-server/lib/umd/languageservice/services/yamlSchemaService.js':
        'patches/unsafe-eval/yamlSchemaService.umd.patch',
    'node_modules/yaml-language-server/out/server/src/languageservice/services/yamlSchemaService.js':
        'patches/unsafe-eval/yamlSchemaService.src.patch',
}

function applyPatch(filePathToPatchPath) {
    for (var filePath in filePathToPatchPath) {
        const pathToPatch = `${__dirname}/${filePathToPatchPath[filePath]}`
        const script = `cd ${rootPackage} && patch ${filePath} ${pathToPatch}`
        console.log(script)
        const output = execSync(script, { encoding: 'utf-8', timeout: 2000 })
    }
}

fs.readFile(pathToFileHover, function (err, data) {
    if (err) throw err
    if (data.indexOf('this.hoverSettings = {showSource: true, showTitle: true};') >= 0) {
        console.log('Patch is already applied')
    } else {
        applyPatch(filePathToPatchPathMarkdown)
        applyPatch(filePathToPatchPathUnsafeEval)
    }
})
