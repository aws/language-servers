import { JsonSchemaServer, JsonSchemaServerProps } from '@lsp-placeholder/aws-lsp-json-common'
import { jsonSchemaUrl } from './urls'

export type BuildspecJsonServerProps = Omit<JsonSchemaServerProps, 'defaultSchemaUri'>

/**
 * This is a demonstration language server that handles JSON files according to the
 * CodeBuild BuildSpec JSON Schema.
 */
export class BuildspecJsonServer extends JsonSchemaServer {
    constructor(props: BuildspecJsonServerProps) {
        super({
            defaultSchemaUri: jsonSchemaUrl,
            ...props,
        })
    }
}
