import {
    CloudFormationServer,
    CloudFormationServerProps,
    CloudFormationServiceProps,
    createCloudFormationService,
    jsonSchemaUrl,
} from '@aws/lsp-cloudformation'
import {
    CachedContentHandler,
    FileHandler,
    HttpHandler,
    UriCacheRepository,
    UriResolver,
    UriResolverBuilder,
    httpsUtils,
} from '@aws/lsp-core'
import { ProposedFeatures, createConnection } from 'vscode-languageserver/node'

function createJsonSchemaResolver(): UriResolver {
    const builder = new UriResolverBuilder()

    const cacheRepository = new UriCacheRepository()

    builder
        .addHandler(new FileHandler())
        .addHandler(
            new CachedContentHandler({
                cacheRepository: cacheRepository,
            })
        )
        .addHandler(new HttpHandler())

    return builder.build()
}

const connection = createConnection(ProposedFeatures.all)

const serviceProps: CloudFormationServiceProps = {
    displayName: CloudFormationServer.serverId,
    defaultSchemaUri: jsonSchemaUrl,
    uriResolver: createJsonSchemaResolver(),
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
