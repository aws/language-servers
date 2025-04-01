import { Server } from '@aws/language-server-runtimes/server-interface'
import { FsRead, FsReadParams } from './fsRead'
import { FsWrite, FsWriteParams } from './fsWrite'

export const FsToolsServer: Server = ({ workspace, logging, agent }) => {
    const fsReadTool = new FsRead({ workspace, logging })
    const fsWriteTool = new FsWrite({ workspace, logging })

    agent.addTool(fsReadTool.getSpec(), fsReadTool.invoke)

    agent.addTool(fsWriteTool.getSpec(), fsWriteTool.invoke)

    return () => {}
}
