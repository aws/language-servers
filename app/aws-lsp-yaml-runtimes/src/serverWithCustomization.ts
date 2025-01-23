import { Diagnostic, TextDocument } from '@aws/language-server-runtimes-types'
import { standalone } from '@aws/language-server-runtimes/runtimes'
import { RuntimeProps } from '@aws/language-server-runtimes/runtimes/runtime'
import { YamlLanguageService } from '@aws/lsp-yaml'
import { getVersionInfo, jsonSchemaUrl, displayName } from './common'
import { Position } from '@aws/language-server-runtimes/protocol'
import { Hover } from 'ts-lsp-client'
import { createCustomYamlLanguageServer } from '@aws/lsp-yaml/out/language-server/yamlServer'

class MyYamlLanguageService extends YamlLanguageService {
    constructor(defaultSchemaUri: string, displayName: string) {
        super({ defaultSchemaUri, displayName })
    }
    public override async doValidation(textDocument: TextDocument): Promise<Diagnostic[]> {
        const originalDiagnostics = await super.doValidation(textDocument)
        const range = { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } }
        const myDiagnostic = { range, message: 'Custom message' }
        return [...originalDiagnostics, myDiagnostic]
    }
    public override async doHover(textDocument: TextDocument, position: Position): Promise<Hover | null> {
        const hover = await super.doHover(textDocument, position)
        hover!.contents = 'Custom content'
        return hover
    }
}

const YamlLanguageServer = createCustomYamlLanguageServer(new MyYamlLanguageService(jsonSchemaUrl, displayName))
const VERSION = getVersionInfo()

const props: RuntimeProps = {
    version: VERSION,
    servers: [YamlLanguageServer],
    name: 'AWS JSON server With Custom YamlLanguageServer',
}
standalone(props)
