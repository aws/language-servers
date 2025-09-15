import { CreateYamlLanguageServer } from '@aws/lsp-yaml'

export const jsonSchemaUrl =
    'https://raw.githubusercontent.com/aws/serverless-application-model/main/samtranslator/schema/schema.json'
export const displayName = 'aws-lsp-yaml-json'

export const createYamlLanguageServer = () => {
    return CreateYamlLanguageServer(displayName, jsonSchemaUrl)
}

export const getVersionInfo = () => {
    const MAJOR = 0
    const MINOR = 1
    const PATCH = 0
    const VERSION = `${MAJOR}.${MINOR}.${PATCH}`
    return VERSION
}
