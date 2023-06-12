import { AwsLanguageService, MutuallyExclusiveLanguageService, SchemaProvider } from '@lsp-placeholder/aws-lsp-core'
import { JsonLanguageService } from '@lsp-placeholder/aws-lsp-json-common'
import { YamlLanguageService } from '@lsp-placeholder/aws-lsp-yaml-common'

export type CloudFormationServiceProps = {
    displayName: string
    defaultSchemaUri: string
    schemaProvider: SchemaProvider
}

export function create(props: CloudFormationServiceProps): AwsLanguageService {
    const jsonService = new JsonLanguageService(props)
    const yamlService = new YamlLanguageService(props)

    return new MutuallyExclusiveLanguageService([jsonService, yamlService])
}
