import { Server } from '@aws/language-server-runtimes/server-interface'
import { FsRead, FsReadParams } from './fsRead'
import { FsWrite, FsWriteParams } from './fsWrite'
import { ListDirectory, ListDirectoryParams } from './listDirectory'
import { ExecuteBash, ExecuteBashParams } from './executeBash'
import { LspGetDocuments, LspGetDocumentsParams } from './lspGetDocuments'
import { LspReadDocumentContents, LspReadDocumentContentsParams } from './lspReadDocumentContents'
import { LspApplyWorkspaceEdit, LspApplyWorkspaceEditParams } from './lspApplyWorkspaceEdit'

export const FsToolsServer: Server = ({ workspace, logging, agent, lsp }) => {
    const fsReadTool = new FsRead({ workspace, logging })
    const fsWriteTool = new FsWrite({ workspace, logging })

    const listDirectoryTool = new ListDirectory({ workspace, logging, lsp })

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

export const BashToolsServer: Server = ({ logging, workspace, agent, lsp }) => {
    const bashTool = new ExecuteBash({ logging, workspace, lsp })
    agent.addTool(bashTool.getSpec(), (input: ExecuteBashParams) => bashTool.invoke(input))
    return () => {}
}

export const LspToolsServer: Server = ({ workspace, logging, lsp, agent }) => {
    const lspGetDocuments = new LspGetDocuments({ workspace, logging })
    const lspReadDocumentContents = new LspReadDocumentContents({ workspace, logging })
    const lspApplyWorkspaceEdit = new LspApplyWorkspaceEdit({ lsp, logging })

    agent.addTool(LspGetDocuments.getSpec(), (input: LspGetDocumentsParams) => lspGetDocuments.invoke(input))
    agent.addTool(LspReadDocumentContents.getSpec(), (input: LspReadDocumentContentsParams) =>
        lspReadDocumentContents.invoke(input)
    )
    agent.addTool(LspApplyWorkspaceEdit.getSpec(), input => lspApplyWorkspaceEdit.invoke(input))

    return () => {}
}
