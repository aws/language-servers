const assert = require('assert')
const yamlPackage = require('@aws/lsp-yaml')

assert.ok(yamlPackage.CreateYamlLanguageServer)
assert.ok(yamlPackage.YamlLanguageService)

console.info('AWS Yaml LSP: all tests passed')
