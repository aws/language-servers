import { S3Server, S3ServerProps, S3ServiceProps, createS3ervice } from '@lsp-placeholder/aws-lsp-s3'
import { ProposedFeatures, createConnection } from 'vscode-languageserver/node'

const connection = createConnection(ProposedFeatures.all)

const serviceProps: S3ServiceProps = {
    displayName: S3Server.serverId,
}

const cloudformationService = createS3ervice(serviceProps)

const props: S3ServerProps = {
    connection,
    s3Service: cloudformationService,
}

export const server = new S3Server(props)
