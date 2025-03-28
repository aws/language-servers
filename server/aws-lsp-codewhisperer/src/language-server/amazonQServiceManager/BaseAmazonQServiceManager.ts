import { CodeWhispererServiceBase } from '../codeWhispererService'
import { AWSQWorkspaceConfigs } from './configurationUtils'

export interface BaseAmazonQServiceManager {
    handleDidChangeConfiguration: () => Promise<void>
    getCodewhispererService: () => CodeWhispererServiceBase
    getConfiguration: () => Readonly<AWSQWorkspaceConfigs>
}
