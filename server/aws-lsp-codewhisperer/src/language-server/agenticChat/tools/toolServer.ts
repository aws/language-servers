import { Server } from '@aws/language-server-runtimes/server-interface'
import { FsRead, FsReadParams } from './fsRead'
import { FsWrite, FsWriteParams } from './fsWrite'
import { ExecuteBash, ExecuteBashParams } from './executeBash'

export const FsToolsServer: Server = ({ workspace, logging, agent }) => {
    const fsReadTool = new FsRead({ workspace, logging })
    const fsWriteTool = new FsWrite({ workspace, logging })

    agent.addTool(fsReadTool.getSpec(), (input: FsReadParams) => fsReadTool.invoke(input))

    agent.addTool(fsWriteTool.getSpec(), (input: FsWriteParams) => fsWriteTool.invoke(input))

    return () => {}
}

export const BashToolsServer: Server = ({ logging, agent }) => {
    const bashTool = new ExecuteBash(logging)
    agent.addTool(bashTool.getSpec(), (input: ExecuteBashParams) => bashTool.invoke(input))
    return () => {}
}
