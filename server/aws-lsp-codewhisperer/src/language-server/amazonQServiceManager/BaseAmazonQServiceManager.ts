import { CodeWhispererServiceBase } from '../codeWhispererService'

export interface BaseAmazonQServiceManager {
    getCodewhispererService: () => CodeWhispererServiceBase
}
