import { Server } from '@aws/language-server-runtimes/server-interface'
import { FsRead } from './fsRead'
import { FsWrite } from './fsWrite'

export const FsToolsServer: Server = ({ workspace, logging, agent }) => {
    const fsRead = new FsRead({ workspace, logging })
    const fsWrite = new FsWrite({ workspace, logging })

    agent.addTool(FsRead.getSpec(), input => {
        return fsRead.invoke(input)
    })

    agent.addTool(FsWrite.getSpec(), input => {
        return fsWrite.invoke(input)
    })

    // nothing to dispose of.
    return () => {}
}
