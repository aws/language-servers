import { RuntimeProps } from '@aws/language-server-runtimes/runtimes/runtime'
import { standalone } from '@aws/language-server-runtimes/runtimes/standalone'
import { ANTLR4LanguageServer } from '@aws/lsp-antlr4'
import { PostgreSQLLexer } from './antlr-generated/PostgreSQLLexer'
import { PostgreSQLParser } from './antlr-generated/PostgreSQLParser'
const props: RuntimeProps = {
    servers: [
        ANTLR4LanguageServer(
            ['sql'],
            charStream => new PostgreSQLLexer(charStream),
            tokenStream => new PostgreSQLParser(tokenStream),
            'root'
        ),
    ],
    name: 'PostgreSQL',
}
standalone(props)
