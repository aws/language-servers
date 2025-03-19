import { CodeWhispererServiceBase } from '../codeWhispererService'

export interface BaseAmazonQServiceManager {
    handleDidChangeConfiguration: () => Promise<void>
    getCodewhispererService: () => CodeWhispererServiceBase
}
