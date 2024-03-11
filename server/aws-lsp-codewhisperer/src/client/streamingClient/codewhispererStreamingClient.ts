import { CodeWhispererStreaming, ExportResultArchiveCommandInput } from '@amzn/codewhisperer-streaming'
import { ConfiguredRetryStrategy } from '@aws-sdk/util-retry'
import * as fs from 'fs/promises'
import * as os from 'os'
const codeWhispererRegion = 'us-east-1'
import path = require('path')
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

export async function downloadExportResultArchive(
    cwStreamingClient: CodeWhispererStreaming,
    exportResultArchiveArgs: ExportResultArchiveCommandInput
) {
    let result
    try {
        result = await cwStreamingClient.exportResultArchive(exportResultArchiveArgs)

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
        const pathTosave = path.join(os.tmpdir(), 'downloadedArtifact.zip')

        console.log('pathTosave --', pathTosave)

        await fs.writeFile(pathTosave, Buffer.concat(buffer))
        return pathTosave
    } catch (e: any) {
        console.log('Error when downloading the artifacts', e)
        return
    }
}
