import { Server } from '@aws/language-server-runtimes/server-interface'
import { AwsLanguageService } from '@aws/lsp-core/out/base'
import {
    CancellationToken,
    CompletionList,
    CompletionParams,
    DidChangeTextDocumentParams,
} from '@aws/language-server-runtimes/server-interface'
import { create } from './yamlJsonService'

/**
 * This is a demonstration language server that handles both JSON and YAML files according to the
 * CloudFormation or SAM JSON-Schema.
 *
 * This illustrates how we can wrap LSP Connection calls around a provided language service.
 * In this case, the service is a composition of a JSON processor and a YAML processor.
 */

export const YamlJsonServerFactory =
    (service: AwsLanguageService): Server =>
    ({ credentialsProvider, lsp, workspace, telemetry, logging }) => {
        const onInitializeHandler = () => {
            return {
                capabilities: {
                    completionProvider: { resolveProvider: true },
                },
            }
        }

        const onInitializedHandler = async () => {}

        const onCompletionHandler = async (
            params: CompletionParams,
            _token: CancellationToken
        ): Promise<CompletionList | null> => {
            const emptyCompletionList = CompletionList.create([])

            const textDocument = await workspace.getTextDocument(params.textDocument.uri)
            if (!textDocument) {
                logging.log(`textDocument [${params.textDocument.uri}] not found`)
                return emptyCompletionList
            }
            const completions = await service.doComplete(textDocument, params.position)
            return completions ?? emptyCompletionList
        }

        const onDidChangeTextDocumentHandler = async (params: DidChangeTextDocumentParams): Promise<any> => {
            const textDocument = await workspace.getTextDocument(params.textDocument.uri)
            if (!textDocument) {
                logging.log(`textDocument [${params.textDocument.uri}] not found`)
                return
            }

            const diagnostics = await service.doValidation(textDocument)

            await lsp.publishDiagnostics({
                uri: params.textDocument.uri,
                diagnostics: diagnostics,
            })
        }

        lsp.onInitialized(onInitializedHandler)
        lsp.onCompletion(onCompletionHandler)
        lsp.onDidChangeTextDocument(onDidChangeTextDocumentHandler)
        lsp.addInitializer(onInitializeHandler)

        logging.log('The YAML JSON LSP Language Server has been initialised')

        // disposable
        return () => {
            // Do nothing
        }
    }

const jsonSchemaUrl =
    'https://raw.githubusercontent.com/aws/serverless-application-model/main/samtranslator/schema/schema.json'

async function getSchema(url: string) {
    const response = await fetch(url)
    const schema = await (await response.blob()).text()

    return schema
}

const yamlJsonServerProps = {
    displayName: 'aws-lsp-yaml-json',
    defaultSchemaUri: jsonSchemaUrl,
    uriResolver: getSchema,
    allowComments: true,
}

const service = create(yamlJsonServerProps)
export const YamlLanguageServer = YamlJsonServerFactory(service)
