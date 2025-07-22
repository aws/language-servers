const assert = require('assert')
const codewhispererPackage = require('@aws/lsp-codewhisperer')

assert.ok(codewhispererPackage.CodeWhispererServer)
assert.ok(codewhispererPackage.CodeWhispererServerProxy)
assert.ok(codewhispererPackage.SecurityScanServerToken)
assert.ok(codewhispererPackage.CodeWhispererSecurityScanServerTokenProxy)
assert.ok(codewhispererPackage.QChatServer)
assert.ok(codewhispererPackage.QChatServerProxy)

console.info('AWS Codewhisperer LSP: all tests passed')
