import { Server } from '@aws/language-server-runtimes/server-interface'
import { FsRead, FsReadParams } from './fsRead'
import { FsWrite, FsWriteParams } from './fsWrite'
import { ListDirectory, ListDirectoryParams } from './listDirectory'
import { ExecuteBash, ExecuteBashParams } from './executeBash'
import { getWorkspaceFolderPaths } from '@aws/lsp-core/out/util/workspaceUtils'

export const FsToolsServer: Server = ({ workspace, logging, agent, lsp }) => {
    const fsReadTool = new FsRead({ workspace, logging })
    const fsWriteTool = new FsWrite({ workspace, logging })

    const listDirectoryTool = new ListDirectory({ workspace, logging }, getWorkspaceFolderPaths(lsp))

    agent.addTool(fsReadTool.getSpec(), async (input: FsReadParams) => {
        // TODO: fill in logic for handling invalid tool invocations
        // TODO: implement chat streaming via queueDescription.
        await fsReadTool.validate(input)
        return await fsReadTool.invoke(input)
    })

    agent.addTool(fsWriteTool.getSpec(), async (input: FsWriteParams) => {
        // TODO: fill in logic for handling invalid tool invocations
        // TODO: implement chat streaming via queueDescription.
        await fsWriteTool.validate(input)
        return await fsWriteTool.invoke(input)
    })

    agent.addTool(listDirectoryTool.getSpec(), (input: ListDirectoryParams) => listDirectoryTool.invoke(input))

    return () => {}
}

export const BashToolsServer: Server = ({ logging, workspace, agent }) => {
    const bashTool = new ExecuteBash({ logging, workspace }, [])
    agent.addTool(bashTool.getSpec(), (input: ExecuteBashParams) => bashTool.invoke(input))
    return () => {}
}
