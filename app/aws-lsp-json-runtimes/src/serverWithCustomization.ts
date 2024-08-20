import { Diagnostic, TextDocument } from '@aws/language-server-runtimes-types'
import { standalone } from '@aws/language-server-runtimes/runtimes'
import { RuntimeProps } from '@aws/language-server-runtimes/runtimes/runtime'
import { JsonLanguageService } from '@aws/lsp-json'
import { createJsonLanguageServer, getVersionInfo, jsonSchemaUrl } from './common'
import { Position } from '@aws/language-server-runtimes/protocol'
import { Hover } from 'ts-lsp-client'

class MyJSONLanguageService extends JsonLanguageService {
    constructor(defaultSchemaUri: string) {
        super({ defaultSchemaUri })
    }
    public async doValidation(textDocument: TextDocument): Promise<Diagnostic[]> {
        const originalDiagnostics = await super.doValidation(textDocument)
        const range = { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } }
        const myDiagnostic = { range, message: 'Custom message' }
        return [...originalDiagnostics, myDiagnostic]
    }
    public async doHover(textDocument: TextDocument, position: Position): Promise<Hover | null> {
        const hover = await super.doHover(textDocument, position)
        hover!.contents = 'Custom content'
        return hover
    }
}

const JsonLanguageServer = createJsonLanguageServer(new MyJSONLanguageService(jsonSchemaUrl))
const VERSION = getVersionInfo()

const props: RuntimeProps = {
    version: VERSION,
    servers: [JsonLanguageServer],
    name: 'AWS JSON server With Custom JsonLanguageServer',
}
standalone(props)
