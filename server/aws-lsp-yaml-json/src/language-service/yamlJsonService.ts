import { AwsLanguageService, MutuallyExclusiveLanguageService, UriResolver } from '@aws/lsp-core/out/base'
import { JsonLanguageService } from './jsonLanguageService'
import { YamlLanguageService } from './yamlLanguageService'

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
