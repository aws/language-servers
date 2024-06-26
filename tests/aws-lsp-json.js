const assert = require('assert')
const jsonPackage = require('@aws/lsp-json')

assert.ok(jsonPackage.CreateJsonLanguageServer)
assert.ok(jsonPackage.JsonLanguageService)

console.info('AWS JSON LSP: all tests passed')
