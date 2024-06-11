import { RuntimeProps } from '@aws/language-server-runtimes/runtimes/runtime'
import { webworker } from '@aws/language-server-runtimes/runtimes/webworker'
import { CreateYamlLanguageServer } from '@aws/lsp-yaml'

const jsonSchemaUrl =
    'https://raw.githubusercontent.com/aws/serverless-application-model/main/samtranslator/schema/schema.json'
const displayName = 'aws-lsp-yaml'

const YamlLanguageServer = CreateYamlLanguageServer(displayName, jsonSchemaUrl)

const MAJOR = 0
const MINOR = 1
const PATCH = 0
const VERSION = `${MAJOR}.${MINOR}.${PATCH}`

const props: RuntimeProps = {
    version: VERSION,
    servers: [YamlLanguageServer],
    name: 'AWS YAML server',
}
webworker(props)
