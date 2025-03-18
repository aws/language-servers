import { CodeWhispererServiceBase } from '../codeWhispererService'

export interface BaseAmazonQServiceManager {
    handleDidChangeConfiguration: () => Promise<void>
    updateClientConfig: (config: { userAgent: string }) => void
    getCodewhispererService: () => CodeWhispererServiceBase
}
