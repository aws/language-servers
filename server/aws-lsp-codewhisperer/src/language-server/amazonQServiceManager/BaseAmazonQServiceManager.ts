import { CodeWhispererServiceBase } from '../codeWhispererService'

export interface BaseAmazonQServiceManager {
    updateClientConfig: (config: { userAgent: string }) => void
    getCodewhispererService: () => CodeWhispererServiceBase
}
