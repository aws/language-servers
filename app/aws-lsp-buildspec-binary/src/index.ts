import { BuildspecServer, BuildspecServerProps, jsonSchemaUrl } from '@lsp-placeholder/aws-lsp-buildspec'
import { httpsUtils } from '@lsp-placeholder/aws-lsp-core'
import { ProposedFeatures, createConnection } from 'vscode-languageserver/node'

const connection = createConnection(ProposedFeatures.all)

let buildSpecSchema: string | undefined

const props: BuildspecServerProps = {
    connection,
    defaultSchemaUri: jsonSchemaUrl,
    uriResolver: async (uri: string) => {
        switch (uri) {
            case jsonSchemaUrl:
                if (!buildSpecSchema) {
                    return await getFileAsync(uri)
                }
                return buildSpecSchema
            default:
                throw new Error(`Unknown schema '${uri}'.`)
        }
    },
}

async function getFileAsync(url: string): Promise<string> {
    return await httpsUtils.requestContent(url)
}

export const server = new BuildspecServer(props)
