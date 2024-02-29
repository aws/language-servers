import { CodeWhispererStreaming, ExportResultArchiveCommandInput } from '@amzn/codewhisperer-streaming'
import { ConfiguredRetryStrategy } from '@aws-sdk/util-retry'
const codeWhispererRegion = 'us-east-1'
const codeWhispererEndpoint = 'https://codewhisperer.us-east-1.amazonaws.com/'

export class FeatureDevClient {

  public async getStreamingClient(credentialsProvider: any) {
    // Should not be stored for the whole session.
    // Client has to be reinitialized for each request so we always have a fresh bearerToken
    return await createFeatureDevStreamingClient(credentialsProvider)
  }


}
export async function createFeatureDevStreamingClient(credentialsProvider: any): Promise<CodeWhispererStreaming> {
  const bearerToken = credentialsProvider.getCredentials('bearer')
  const streamingClient = new CodeWhispererStreaming({
    region: codeWhispererRegion,
    endpoint: codeWhispererEndpoint,
    token: { token: bearerToken },
    // SETTING max attempts to 0 FOR BETA. RE-ENABLE FOR RE-INVENT
    // Implement exponential back off starting with a base of 500ms (500 + attempt^10)
    retryStrategy: new ConfiguredRetryStrategy(0, (attempt: number) => 500 + attempt ** 10),
  })
  return streamingClient
}



export async function downloadExportResultArchive(
  cwStreamingClient: CodeWhispererStreaming,
  exportResultArchiveArgs: ExportResultArchiveCommandInput,
  // toPath: string
) {
  const apiStartTime = Date.now()
  let totalDownloadBytes = 0
  const result = await cwStreamingClient.exportResultArchive(exportResultArchiveArgs)

  const buffer = []

  console.log('what is the respone' + result)

  // for await (const chunk of result.body) {

  // if (chunk.binaryPayloadEvent) {
  //     const chunkData = chunk.binaryPayloadEvent
  //     if (chunkData.bytes) {
  //         buffer.push(chunkData.bytes)
  //         totalDownloadBytes += chunkData.bytes?.length
  //     }
  // }
  // }

  // await fsCommon.writeFile(toPath, Buffer.concat(buffer))

}

