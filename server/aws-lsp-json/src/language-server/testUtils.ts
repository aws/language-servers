import { TextDocument } from 'vscode-languageserver-textdocument'
import { TextDocumentItem } from 'vscode-languageserver-types'

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
    'file:///testJSONvalidation.json',
    'json',
    1,
    JSON_VALIDATION_CONTENT
)

export const JSON_VALIDATION_OPEN_FILE_ITEM = TextDocumentItem.create(
    'file:///testJSONnewfilevalidation.json',
    'json',
    1,
    JSON_VALIDATION_CONTENT
)
export const JSON_VALIDATION_OPEN_FILE = TextDocument.create(
    'file:///testJSONnewfilevalidation.json',
    'json',
    1,
    JSON_VALIDATION_CONTENT
)

const JSON_HOVER_CONTENT = `{
    "testHover": "Test hover field"
}`
export const JSON_HOVER_POSITION = { line: 2, character: 5 }
export const JSON_HOVER_FILE = TextDocument.create('file:///testJSONhover.json', 'json', 1, JSON_HOVER_CONTENT)

const JSON_FORMAT_CONTENT = `{
    "testFormat": 'test format field"
}`
export const JSON_FORMAT_FILE = TextDocument.create('file:///testJSONformat.json', 'json', 1, JSON_FORMAT_CONTENT)
export const JSON_FORMAT_RANGE = {
    start: {
        line: 0,
        character: 0,
    },
    end: {
        line: 3,
        character: 0,
    },
}
