const execFileSync = require('child_process').execFileSync
const fs = require('node:fs')
const path = require('path')

const locale = path[process.platform === 'win32' ? 'win32' : 'posix']

const pathToYamlPackage = require.resolve('yaml-language-server')

const pathToIndex = 'node_modules/yaml-language-server/out/server/src/index.js'.split('/').join(locale.sep)
const rootPackage = pathToYamlPackage.substring(0, pathToYamlPackage.indexOf(pathToIndex))

const pathToFileHover = path.join(
    rootPackage,
    'node_modules/yaml-language-server/lib/esm/languageservice/services/yamlHover.js'
)

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

function getPatchProcCommand(filePath, pathToPatch) {
    if (process.platform === 'win32') {
        return execFileSync('git', ['apply', '--ignore-whitespace', pathToPatch], {
            cwd: rootPackage,
            encoding: 'utf-8',
            timeout: 2000,
        })
    }
    return execFileSync('patch', [filePath, pathToPatch], {
        cwd: rootPackage,
        encoding: 'utf-8',
        timeout: 2000,
    })
}

function applyPatch(filePathToPatchPath) {
    for (var filePath in filePathToPatchPath) {
        const pathToPatch = `${__dirname}/${filePathToPatchPath[filePath]}`
        const patchProc = getPatchProcCommand(filePath, pathToPatch)

        console.log({
            cmd: patchProc.spawnfile,
            args: patchProc.spawnargs,
            cwd: rootPackage,
        })
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
