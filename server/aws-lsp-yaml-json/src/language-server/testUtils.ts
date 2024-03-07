import { TextDocument } from 'vscode-languageserver-textdocument'

const JSON_COMPLETION_CONTENT = `{
    "greet"
}`
export const JSON_COMPLETION_POSITION = { line: 2, character: 11 }
export const JSON_COMPLETION_FILE = TextDocument.create(
    'file:///testJSONcompletion.json',
    'json',
    1,
    JSON_COMPLETION_CONTENT
)

const JSON_VALIDATION_CONTENT = `{
    "testHello": "Hello World!",
    "testNumber": 100nm500
}`
export const JSON_VALIDATION_FILE = TextDocument.create(
    'file:///testJSONvalidation.yml',
    'json',
    1,
    JSON_VALIDATION_CONTENT
)
