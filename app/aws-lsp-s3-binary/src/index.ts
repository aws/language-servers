import {
    AwsInitializationOptions,
    EncryptionInitialization,
    IdeCredentialsProvider,
    shouldWaitForEncryptionKey,
    validateEncryptionDetails,
} from '@lsp-placeholder/aws-lsp-core'
import { S3Server, S3ServerProps, S3ServiceProps, createS3Service } from '@lsp-placeholder/aws-lsp-s3'
import { Readable } from 'stream'
import { ProposedFeatures, createConnection } from 'vscode-languageserver/node'

const lspConnection = createConnection(ProposedFeatures.all)

if (shouldWaitForEncryptionKey()) {
    // Before starting the language server, accept encryption initialization details
    // directly from the host. This avoids writing the key to the same channel used
    // to send encrypted data.
    // Contract: Only read up to (and including) the first newline (\n).
    readLine(process.stdin).then(input => {
        const encryptionDetails = JSON.parse(input) as EncryptionInitialization

        validateEncryptionDetails(encryptionDetails)

        createServer(lspConnection, encryptionDetails.key)
    })
} else {
    createServer(lspConnection)
}

/**
 * Read from the given stream, stopping after the first newline (\n).
 * Return the string consumed from the stream.
 */
function readLine(stream: Readable): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        let contents = ''

        // Fires when the stream has contents that can be read
        const onStreamIsReadable = () => {
            while (true) {
                const byteRead: Buffer = process.stdin.read(1)
                if (byteRead == null) {
                    // wait for more content to arrive on the stream
                    break
                }

                const nextChar = byteRead.toString('utf-8')
                contents += nextChar

                if (nextChar == '\n') {
                    // Stop reading this stream, we have read a line from it
                    stream.removeListener('readable', onStreamIsReadable)
                    resolve(contents)
                    break
                }
            }
        }

        stream.on('readable', onStreamIsReadable)
    })
}

function createServer(connection: any, key?: string): S3Server {
    const credentialsProvider = new IdeCredentialsProvider(connection, key)

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
