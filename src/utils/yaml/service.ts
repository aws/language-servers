import {
    CompletionItem,
    CompletionList,
    Diagnostic,
    Hover,
    HoverParams,
    TextDocumentPositionParams,
} from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { createConnection } from 'vscode-languageserver/lib/node/main'
import { URI } from 'vscode-uri'
import {
    LanguageSettings,
    LanguageService as OriginalYamlLanguageService,
    SchemaRequestService,
    SchemasSettings,
    getLanguageService as getYamlLanguageService,
} from 'yaml-language-server'
import { LanguageService } from '../../service/types'
import { UriContentResolver } from '../uri/resolve'
import { YAMLTelemetry } from './telemetry'

/**
 * This class wraps {@link OriginalYamlLanguageService}.
 * It performs additional operations before redirecting
 * the call to {@link OriginalYamlLanguageService}.
 * ---
 * ## Why?
 *
 * We need this class due to the design of the YAML Language
 * Service. We cannot use it as if it were a function, passing
 * ALL arguments that it would need to perform a function.
 *
 * Instead, the current implementation requires us to set some
 * properties on the instance PRIOR to using its functionality.
 *
 * An example is the schema, the YAML service requires the user
 * pre-define the mapping between uri and schema. This is not
 * a good way to do it. [See code here.](https://github.com/redhat-developer/yaml-language-server/blob/d3e36a385f74b7fe58cace8db4824f51f35d3b62/src/languageservice/yamlLanguageService.ts#L207)
 *
 * Instead, the user should be passing the correct schema from
 * their end as an additional argument. The user should be in
 * charge of ensuring they provide the correct schema.
 * ---
 * # TODO
 *
 * Update the YAML Language Service api to allow us to
 * pass in additional arguments directly in to the function
 * calls. Then this class will not be necessary anymore.
 */
export class YamlLanguageService implements LanguageService {
    private _instance = new YamlLanguageServiceBuilder().instance()

    constructor(private readonly schemaUri: string) {}

    completion(
        document: TextDocument,
        textDocumentPosition: TextDocumentPositionParams
    ): Promise<CompletionItem[] | CompletionList> {
        this.updateSchemaMapping(document.uri)
        return this._instance.doComplete(document, textDocumentPosition.position, false)
    }
    diagnostic(document: TextDocument): Promise<Diagnostic[]> {
        this.updateSchemaMapping(document.uri)
        return this._instance.doValidation(document, false)
    }
    hover(document: TextDocument, params: HoverParams): Promise<Hover | null> {
        this.updateSchemaMapping(document.uri)
        return this._instance.doHover(document, params.position)
    }

    private updateSchemaMapping(documentUri: string): void {
        const languageSettings = YamlLanguageServiceBuilder.createLanguageSettings({
            fileMatch: [documentUri],
            uri: this.schemaUri,
        })
        this._instance.configure(languageSettings)
    }
}

export class YamlLanguageServiceBuilder {
    instance(languageSettings?: LanguageSettings): OriginalYamlLanguageService {
        const uriResolver = new UriContentResolver()
        const schemaResolver: SchemaRequestService = (uri: string) => {
            return uriResolver.getContent(URI.parse(uri))
        }

        const workspaceContext = {
            resolveRelativePath(relativePath: string, resource: string) {
                return new URL(relativePath, resource).href
            },
        }
        const connection = createConnection()
        const yamlTelemetry = new YAMLTelemetry(connection)
        const yaml = getYamlLanguageService({
            schemaRequestService: schemaResolver,
            workspaceContext,
            connection,
            telemetry: yamlTelemetry,
        })

        if (languageSettings) {
            yaml.configure(languageSettings)
        }

        return yaml
    }

    static createLanguageSettings(schemaSettings?: SchemasSettings): LanguageSettings {
        const defaultLanguageSettings: LanguageSettings = {
            hover: true,
            completion: true,
            validate: true,
            customTags: [],
        }
        if (schemaSettings) {
            defaultLanguageSettings.schemas = [schemaSettings]
        }
        return defaultLanguageSettings
    }
}
