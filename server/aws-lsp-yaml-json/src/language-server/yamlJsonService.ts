import { AwsLanguageService, MutuallyExclusiveLanguageService, UriResolver } from '@lsp-placeholder/aws-lsp-core'
import { JsonLanguageService } from '@lsp-placeholder/aws-lsp-json-common'
import { YamlLanguageService } from '@lsp-placeholder/aws-lsp-yaml-common'

export type YamlJsonServiceProps = {
    displayName: string
    defaultSchemaUri: string
    uriResolver: UriResolver
    allowComments?: boolean
}

export function create(props: YamlJsonServiceProps): AwsLanguageService {
    const jsonService = new JsonLanguageService(props)
    const yamlService = new YamlLanguageService(props)

    return new MutuallyExclusiveLanguageService([jsonService, yamlService])
}
