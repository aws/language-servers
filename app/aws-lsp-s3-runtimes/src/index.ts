import {
    AwsInitializationOptions,
    EncryptionInitialization,
    IdeCredentialsProvider,
    readEncryptionInitialization,
    shouldWaitForEncryptionKey,
} from '@aws/lsp-core'
import { S3Server, S3ServerProps, S3ServiceProps, createS3Service } from '@aws/lsp-s3'
import { ProposedFeatures, createConnection } from 'vscode-languageserver/node'

const lspConnection = createConnection(ProposedFeatures.all)

if (shouldWaitForEncryptionKey()) {
    // Before starting the language server, accept encryption initialization details
    // directly from the host. This avoids writing the key to the same channel used
    // to send encrypted data.
    // Contract: Only read up to (and including) the first newline (\n).
    readEncryptionInitialization(process.stdin).then(encryptionInit => {
        createServer(lspConnection, encryptionInit)
    })
} else {
    createServer(lspConnection)
}

function createServer(connection: any, encryptionInit?: EncryptionInitialization): S3Server {
    const credentialsProvider = new IdeCredentialsProvider(connection, encryptionInit?.key, encryptionInit?.mode)

    const serviceProps: S3ServiceProps = {
        displayName: S3Server.serverId,
        credentialsProvider,
    }

    const service = createS3Service(serviceProps)

    const props: S3ServerProps = {
        connection,
        s3Service: service,
        onInitialize: (props: AwsInitializationOptions) => {
            credentialsProvider.initialize(props)
        },
    }

    return new S3Server(props)
}
