import { AwsLanguageService, MutuallyExclusiveLanguageService, UriResolver } from '@aws/lsp-core/out/base'
import { JsonLanguageService } from '@aws/lsp-json-common'
import { YamlLanguageService } from '@aws/lsp-yaml-common'

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
