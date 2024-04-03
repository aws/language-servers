import { CodeWhispererStreaming, ExportIntent } from '@amzn/codewhisperer-streaming'
import { ConfiguredRetryStrategy } from '@aws-sdk/util-retry'
import { Workspace } from '@aws/language-server-runtimes/server-interface'
import * as fs from 'fs'
import { QNetDownloadArtifactsResponse } from '../../language-server/netTransform/models'
const codeWhispererRegion = 'us-east-1'
import path = require('path')
import AdmZip = require('adm-zip')
const codeWhispererEndpoint = 'https://codewhisperer.us-east-1.amazonaws.com/'

export class StreamingClient {
    public async getStreamingClient(credentialsProvider: any) {
        return await createStreamingClient(credentialsProvider)
    }
}
export async function createStreamingClient(credentialsProvider: any): Promise<CodeWhispererStreaming> {
    const creds = credentialsProvider.getCredentials('bearer')
    const streamingClient = new CodeWhispererStreaming({
        region: codeWhispererRegion,
        endpoint: codeWhispererEndpoint,
        token: { token: creds.token },
        retryStrategy: new ConfiguredRetryStrategy(0, (attempt: number) => 500 + attempt ** 10),
    })
    return streamingClient
}

export async function downloadExportResultArchive(
    cwStreamingClient: CodeWhispererStreaming,
    exportId: string,
    workspace: Workspace
) {
    let result
    try {
        result = await cwStreamingClient.exportResultArchive({
            exportId,
            exportIntent: ExportIntent.TRANSFORMATION,
        })

        const buffer = []

        if (result.body === undefined) {
            throw new Error('Empty response from CodeWhisperer Streaming service.')
        }

        for await (const chunk of result.body) {
            if (chunk.binaryPayloadEvent) {
                const chunkData = chunk.binaryPayloadEvent
                if (chunkData.bytes) {
                    buffer.push(chunkData.bytes)
                }
            }
        }
        const tempDir = path.join(workspace.fs.getTempDirPath(), exportId)
        const pathToArchive = path.join(tempDir, 'ExportResultsArchive.zip')
        await directoryExists(tempDir)
        await fs.writeFileSync(pathToArchive, Buffer.concat(buffer))
        let pathContainingArchive = ''
        pathContainingArchive = path.dirname(pathToArchive)
        const zip = new AdmZip(pathToArchive)
        zip.extractAllTo(pathContainingArchive)
        pathContainingArchive = path.join(pathContainingArchive, 'sourceCode')
        console.log('pathContainingArchive :', pathContainingArchive)
        return {
            PathTosave: pathContainingArchive,
        } as QNetDownloadArtifactsResponse
    } catch (error) {
        const errorMessage = (error as Error).message ?? 'Failed to download the artifacts'
        return {
            Error: errorMessage,
        } as QNetDownloadArtifactsResponse
    }
}

async function directoryExists(directoryPath: any) {
    try {
        await fs.accessSync(directoryPath)
    } catch (error) {
        // Directory doesn't exist, create it
        await fs.mkdirSync(directoryPath, { recursive: true })
    }
}
