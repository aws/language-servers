import { Server } from '@aws/language-server-runtimes/server-interface'
import { AwsLanguageService, textDocumentUtils } from '@aws/lsp-core/out/base'
import { TextDocument, Range } from 'vscode-languageserver-textdocument'
import {
    Hover,
    HoverParams,
    DidOpenTextDocumentParams,
    DocumentFormattingParams,
    TextDocumentSyncKind,
    TextEdit,
} from 'vscode-languageserver'
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
                    hoverProvider: true,
                    documentFormattingProvider: true,
                    textDocumentSync: {
                        openClose: true,
                        change: TextDocumentSyncKind.Incremental,
                    },
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

        const onHoverHandler = async (params: HoverParams, _token: CancellationToken): Promise<Hover | null> => {
            const textDocument = await workspace.getTextDocument(params.textDocument.uri)
            if (!textDocument) {
                logging.log(`textDocument [${params.textDocument.uri}] not found`)
                return null
            }
            const hover = await service.doHover(textDocument, params.position)
            return hover
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
                version: textDocument.version,
            })
        }

        const onDidOpenTextDocumentHandler = async (params: DidOpenTextDocumentParams): Promise<any> => {
            let textDocument = await workspace.getTextDocument(params.textDocument.uri)
            if (!textDocument) {
                textDocument = TextDocument.create(
                    params.textDocument.uri,
                    params.textDocument.languageId,
                    params.textDocument.version,
                    params.textDocument.text
                )
            }

            const diagnostics = await service.doValidation(textDocument)

            await lsp.publishDiagnostics({
                uri: params.textDocument.uri,
                diagnostics: diagnostics,
                version: textDocument.version,
            })
        }

        const onFormatHandler = async (params: DocumentFormattingParams): Promise<TextEdit[] | null> => {
            const textDocument = await workspace.getTextDocument(params.textDocument.uri)
            if (!textDocument) {
                logging.log(`textDocument [${params.textDocument.uri}] not found`)
                return null
            }

            const format = service.format(textDocument, textDocumentUtils.getFullRange(textDocument), params.options)

            return format
        }

        lsp.onInitialized(onInitializedHandler)
        lsp.onCompletion(onCompletionHandler)
        lsp.onDidChangeTextDocument(onDidChangeTextDocumentHandler)
        lsp.onDidOpenTextDocument(onDidOpenTextDocumentHandler)
        lsp.onHover(onHoverHandler)
        lsp.onDidFormatDocument(onFormatHandler)
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
