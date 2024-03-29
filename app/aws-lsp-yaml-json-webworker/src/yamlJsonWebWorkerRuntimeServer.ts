import { webworker } from '@aws/language-server-runtimes/runtimes/webworker'
import { RuntimeProps } from '@aws/language-server-runtimes/runtimes/runtime'
import { YamlLanguageServer } from '@aws/aws-lsp-yaml-json'

const MAJOR = 0
const MINOR = 1
const PATCH = 0
const VERSION = `${MAJOR}.${MINOR}.${PATCH}`

const props: RuntimeProps = {
    version: VERSION,
    servers: [YamlLanguageServer],
    name: 'AWS YAML/JSON server',
}
webworker(props)
