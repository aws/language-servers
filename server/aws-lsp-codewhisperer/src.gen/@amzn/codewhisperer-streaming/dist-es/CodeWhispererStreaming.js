import { CodeWhispererStreamingClient } from './CodeWhispererStreamingClient'
import { ExportResultArchiveCommand } from './commands/ExportResultArchiveCommand'
import { GenerateAssistantResponseCommand } from './commands/GenerateAssistantResponseCommand'
import { GenerateTaskAssistPlanCommand } from './commands/GenerateTaskAssistPlanCommand'
import { createAggregatedClient } from '@smithy/smithy-client'
const commands = {
    ExportResultArchiveCommand,
    GenerateAssistantResponseCommand,
    GenerateTaskAssistPlanCommand,
}
export class CodeWhispererStreaming extends CodeWhispererStreamingClient {}
createAggregatedClient(commands, CodeWhispererStreaming)
