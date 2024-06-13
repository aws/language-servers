import { AwsLanguageService, MutuallyExclusiveLanguageService, UriResolver } from '@aws/lsp-core/out/base'
import { CompletionList, Diagnostic, Hover, Position, Range, TextEdit } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { LanguageService, getLanguageService } from 'yaml-language-server'
import { YamlFormattingOptions } from './formattingOptions'

export type YamlLanguageServiceProps = {
    displayName: string
    defaultSchemaUri: string
    uriResolver: UriResolver
}

/**
 * This is a thin wrapper around the Redhat Yaml Language Service
 * https://github.com/redhat-developer/yaml-language-server/
 */
export class YamlLanguageService implements AwsLanguageService {
    private yamlService: LanguageService

    constructor(private readonly props: YamlLanguageServiceProps) {
        const workspaceContext = {
            resolveRelativePath(relativePath: string, resource: string) {
                return new URL(relativePath, resource).href
            },
        }

        this.yamlService = getLanguageService({
            schemaRequestService: this.props.uriResolver,
            workspaceContext,
        })

        this.yamlService.configure({ schemas: [{ fileMatch: ['*'], uri: this.props.defaultSchemaUri }] })
    }

    public isSupported(document: TextDocument): boolean {
        return document.languageId === 'yaml'
    }

    public doValidation(document: TextDocument): Promise<Diagnostic[]> {
        this.updateSchemaMapping(document.uri)
        return this.yamlService.doValidation(document, false)
    }

    public doComplete(document: TextDocument, position: Position): Promise<CompletionList> {
        this.updateSchemaMapping(document.uri)
        return this.yamlService.doComplete(document, position, false)
    }

    public doHover(document: TextDocument, position: Position): Promise<Hover | null> {
        this.updateSchemaMapping(document.uri)
        return this.yamlService.doHover(document, position)
    }

    public format(document: TextDocument, range: Range, options: YamlFormattingOptions): TextEdit[] {
        this.updateSchemaMapping(document.uri)
        return this.yamlService.doFormat(document, options)
    }

    private updateSchemaMapping(documentUri: string): void {
        this.yamlService.configure({
            hover: true,
            completion: true,
            format: true,
            validate: true,
            customTags: [],
            schemas: [
                {
                    fileMatch: [documentUri],
                    uri: this.props.defaultSchemaUri,
                    name: this.props.displayName,
                    description: 'some description,',
                },
            ],
        })
    }
}

export function create(props: YamlLanguageServiceProps): AwsLanguageService {
    const jsonService = new YamlLanguageService(props)

    return new MutuallyExclusiveLanguageService([jsonService])
}
