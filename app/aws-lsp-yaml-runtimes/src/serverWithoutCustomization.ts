import { standalone } from '@aws/language-server-runtimes/runtimes'
import { RuntimeProps } from '@aws/language-server-runtimes/runtimes/runtime'
import { createYamlLanguageServer, getVersionInfo } from './common'

const YamlLanguageServer = createYamlLanguageServer()
const VERSION = getVersionInfo()

const props: RuntimeProps = {
    version: VERSION,
    servers: [YamlLanguageServer],
    name: 'AWS YAML server',
}
standalone(props)
