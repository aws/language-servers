import { standalone } from '@aws/language-server-runtimes/runtimes'
import { RuntimeProps } from '@aws/language-server-runtimes/runtimes/runtime'
import { createJsonLanguageServer, getVersionInfo } from './common'

const JsonLanguageServer = createJsonLanguageServer()
const VERSION = getVersionInfo()

const props: RuntimeProps = {
    version: VERSION,
    servers: [JsonLanguageServer],
    name: 'AWS JSON server',
}
standalone(props)
