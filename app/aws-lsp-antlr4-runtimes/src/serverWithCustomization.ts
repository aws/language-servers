import type { Diagnostic, TextDocument } from '@aws/language-server-runtimes-types'
import { RuntimeProps } from '@aws/language-server-runtimes/runtimes/runtime'
import { standalone } from '@aws/language-server-runtimes/runtimes/standalone'
import { ANTLR4LanguageService } from '@aws/lsp-antlr4'
import { createCustomAntlr4LanguageServer } from '@aws/lsp-antlr4/out/language-server/server'
import { PostgreSQLLexer } from './antlr-generated/PostgreSQLLexer'
import { PostgreSQLParser } from './antlr-generated/PostgreSQLParser'

class MyANTLR4LanguageService extends ANTLR4LanguageService {
    public override async doValidation(_textDocument: TextDocument): Promise<Diagnostic[]> {
        // disable diagnostics
        return []
    }
}

const ANTLR4LanguageServer = createCustomAntlr4LanguageServer(
    new MyANTLR4LanguageService(
        ['sql'],
        charStream => new PostgreSQLLexer(charStream),
        tokenStream => new PostgreSQLParser(tokenStream),
        'root',
        []
    )
)
const props: RuntimeProps = {
    servers: [ANTLR4LanguageServer],
    name: 'PostgreSQL',
}
standalone(props)
