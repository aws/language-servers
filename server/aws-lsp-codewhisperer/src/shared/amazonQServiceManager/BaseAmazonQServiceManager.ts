import { CodeWhispererServiceBase } from '../codeWhispererService'
import { AmazonQWorkspaceConfig } from './configurationUtils'

export interface BaseAmazonQServiceManager {
    handleDidChangeConfiguration: () => Promise<Readonly<AmazonQWorkspaceConfig>>
    getCodewhispererService: () => CodeWhispererServiceBase
    getConfiguration: () => Readonly<AmazonQWorkspaceConfig>
}
