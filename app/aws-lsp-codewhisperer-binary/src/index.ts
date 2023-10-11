import { standalone } from '@aws-placeholder/aws-language-server-runtimes';
import { RuntimeProps } from '@aws-placeholder/aws-language-server-runtimes/out/runtimes/runtime';
import { CodeWhispererServerToken } from '@lsp-placeholder/aws-lsp-codewhisperer';

const MAJOR: number = 0;
const MINOR: number = 1;
const PATCH: number = 0;
const VERSION: string = `${MAJOR}.${MINOR}.${PATCH}`

const props: RuntimeProps = {
    version: VERSION,
    servers: [CodeWhispererServerToken]
}
standalone(props)
