import { DidChangeConfigurationParams } from '@aws/language-server-runtimes/protocol'
import { CodeWhispererServiceBase } from '../codeWhispererService'

export interface BaseAmazonQServiceManager {
    handleDidChangeConfiguration: (ideCategory?: string, params?: DidChangeConfigurationParams) => Promise<void>
    getCodewhispererService: () => CodeWhispererServiceBase
}
