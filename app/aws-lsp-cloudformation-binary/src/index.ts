import {
    CloudFormationServer,
    CloudFormationServerProps,
    CloudFormationServiceProps,
    createCloudFormationService,
    jsonSchemaUrl,
} from '@lsp-placeholder/aws-lsp-cloudformation'
import { httpsUtils } from '@lsp-placeholder/aws-lsp-core'
import { ProposedFeatures, createConnection } from 'vscode-languageserver/node'

const connection = createConnection(ProposedFeatures.all)

// simple in-memory 'cache'
let cfnSchema: string | undefined

const serviceProps: CloudFormationServiceProps = {
    displayName: CloudFormationServer.serverId,
    defaultSchemaUri: jsonSchemaUrl,
    schemaProvider: async (uri: string) => {
        switch (uri) {
            case jsonSchemaUrl:
                if (!cfnSchema) {
                    cfnSchema = await getFileAsync(uri)
                }
                return cfnSchema
            default:
                throw new Error(`Unknown schema '${uri}'.`)
        }
    },
}

const cloudformationService = createCloudFormationService(serviceProps)

const props: CloudFormationServerProps = {
    connection,
    cloudformationService: cloudformationService,
}

async function getFileAsync(url: string): Promise<string> {
    return await httpsUtils.requestContent(url)
}

export const server = new CloudFormationServer(props)
