const execFileSync = require('child_process').execFileSync
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
        const patchProc = execFileSync('patch', [filePath, pathToPatch], { cwd: rootPackage, encoding: 'utf-8', timeout: 2000 })

        console.log({
            cmd: patchProc.spawnfile,
            args: patchProc.spawnargs,
            cwd: rootPackage,
        });
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
