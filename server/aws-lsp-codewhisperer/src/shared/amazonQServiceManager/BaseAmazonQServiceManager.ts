import { CodeWhispererServiceBase } from '../../client/codeWhispererService'

export interface BaseAmazonQServiceManager {
    handleDidChangeConfiguration: () => Promise<void>
    getCodewhispererService: () => CodeWhispererServiceBase
}
