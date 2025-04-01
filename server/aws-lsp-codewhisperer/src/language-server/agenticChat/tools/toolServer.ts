import { Server } from '@aws/language-server-runtimes/server-interface'
import { FsRead, FsReadParams } from './fsRead'
import { FsWrite, FsWriteParams } from './fsWrite'

export const FsToolsServer: Server = ({ workspace, logging, agent }) => {
    const fsRead = new FsRead({ workspace, logging })
    const fsWrite = new FsWrite({ workspace, logging })

    agent.addTool(FsRead.getSpec(), (input: FsReadParams) => {
        return fsRead.invoke(input)
    })

    agent.addTool(FsWrite.getSpec(), (input: FsWriteParams) => {
        return fsWrite.invoke(input)
    })

    // nothing to dispose of.
    return () => {}
}
