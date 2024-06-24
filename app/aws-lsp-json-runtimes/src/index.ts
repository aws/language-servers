import { standalone } from '@aws/language-server-runtimes/runtimes'
import { RuntimeProps } from '@aws/language-server-runtimes/runtimes/runtime'
import { CreateJsonLanguageServer } from '@aws/lsp-json'

const jsonSchemaUrl =
    'https://raw.githubusercontent.com/aws/serverless-application-model/main/samtranslator/schema/schema.json'
const displayName = 'aws-lsp-yaml-json'

const JsonLanguageServer = CreateJsonLanguageServer(jsonSchemaUrl)

const MAJOR = 0
const MINOR = 1
const PATCH = 0
const VERSION = `${MAJOR}.${MINOR}.${PATCH}`

const props: RuntimeProps = {
    version: VERSION,
    servers: [JsonLanguageServer],
    name: 'AWS JSON server',
}
standalone(props)
