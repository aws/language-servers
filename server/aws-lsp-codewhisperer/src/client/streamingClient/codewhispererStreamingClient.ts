import { CodeWhispererStreaming, ExportIntent } from '@amzn/codewhisperer-streaming'
import { ConfiguredRetryStrategy } from '@aws-sdk/util-retry'
import * as fs from 'fs/promises'
import * as os from 'os'
const codeWhispererRegion = 'us-east-1'
import path = require('path')
import AdmZip = require('adm-zip')
import { PathLike } from 'fs'
const codeWhispererEndpoint = 'https://rts.alpha-us-west-2.codewhisperer.ai.aws.dev/'
// 'https://codewhisperer.us-east-1.amazonaws.com/'

export class StreamingClient {
    public async getStreamingClient(credentialsProvider: any) {
        // Should not be stored for the whole session.
        // Client has to be reinitialized for each request so we always have a fresh bearerToken
        return await createFeatureDevStreamingClient(credentialsProvider)
    }
}
export async function createFeatureDevStreamingClient(credentialsProvider: any): Promise<CodeWhispererStreaming> {
    const creds = credentialsProvider.getCredentials('bearer')
    console.log('bearerToken')
    console.log(creds)
    const streamingClient = new CodeWhispererStreaming({
        region: codeWhispererRegion,
        endpoint: codeWhispererEndpoint,
        token: { token: creds.token },
        // SETTING max attempts to 0 FOR BETA. RE-ENABLE FOR RE-INVENT
        // Implement exponential back off starting with a base of 500ms (500 + attempt^10)
        retryStrategy: new ConfiguredRetryStrategy(0, (attempt: number) => 500 + attempt ** 10),
    })
    return streamingClient
}

export async function downloadExportResultArchive(cwStreamingClient: CodeWhispererStreaming, exportId: string) {
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
        const tempDir = path.join(os.tmpdir(), exportId)
        const pathToArchive = path.join(tempDir, 'ExportResultsArchive.zip')
        await directoryExists(tempDir)
        await fs.writeFile(pathToArchive, Buffer.concat(buffer))
        let pathContainingArchive = ''
        pathContainingArchive = path.dirname(pathToArchive)
        const zip = new AdmZip(pathToArchive)
        zip.extractAllTo(pathContainingArchive)

        console.log('pathContainingArchive :', pathContainingArchive)

        return pathContainingArchive
    } catch (error) {
        const errorMessage = (error as Error).message ?? 'Failed to download the artifacts'
        throw new Error(errorMessage)
    }
}

async function directoryExists(directoryPath: PathLike) {
    try {
        await fs.access(directoryPath)
    } catch (error) {
        // Directory doesn't exist, create it
        await fs.mkdir(directoryPath, { recursive: true })
    }
}
