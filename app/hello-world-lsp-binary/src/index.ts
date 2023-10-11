import { standalone } from '@aws-placeholder/aws-language-server-runtimes/out/runtimes';
import { RuntimeProps } from '@aws-placeholder/aws-language-server-runtimes/out/runtimes/runtime';
import { HelloWorldServer } from '@lsp-placeholder/hello-world-lsp';

const MAJOR: number = 0;
const MINOR: number = 1;
const PATCH: number = 0;
const VERSION: string = `${MAJOR}.${MINOR}.${PATCH}`

const props: RuntimeProps = {
    version: VERSION,
    servers: [HelloWorldServer]
}
standalone(props)
