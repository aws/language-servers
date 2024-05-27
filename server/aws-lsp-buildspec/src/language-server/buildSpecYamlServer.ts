import { YamlSchemaServer, YamlSchemaServerProps } from './yamlSchemaServer'
import { jsonSchemaUrl } from './urls'

export type BuildspecYamlServerProps = Omit<YamlSchemaServerProps, 'defaultSchemaUri'>

/**
 * This is a demonstration language server that handles YAML files according to the
 * CodeBuild BuildSpec JSON Schema.
 */
export class BuildspecYamlServer extends YamlSchemaServer {
    constructor(props: BuildspecYamlServerProps) {
        super({
            defaultSchemaUri: jsonSchemaUrl,
            ...props,
        })
    }
}
