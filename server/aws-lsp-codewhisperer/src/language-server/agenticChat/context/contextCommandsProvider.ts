import * as path from 'path'
import { FSWatcher, watch } from 'chokidar'
import {
    ContextCommand,
    ContextCommandGroup,
    CreateFilesParams,
    DeleteFilesParams,
    RenameFilesParams,
} from '@aws/language-server-runtimes/protocol'
import { Disposable } from 'vscode-languageclient/node'
import { Chat, Logging, Lsp, Workspace } from '@aws/language-server-runtimes/server-interface'
import { getUserPromptsDirectory, promptFileExtension } from './contextUtils'
import { ContextCommandItem } from 'local-indexing'
import { LocalProjectContextController } from '../../../shared/localProjectContextController'
import { URI } from 'vscode-uri'

export class ContextCommandsProvider implements Disposable {
    private promptFileWatcher?: FSWatcher
    private cachedContextCommands?: ContextCommandItem[]
    constructor(
        private readonly logging: Logging,
        private readonly chat: Chat,
        private readonly workspace: Workspace,
        private readonly lsp: Lsp
    ) {
        this.registerPromptFileWatcher()
        this.lsp.workspace.onDidCreateFiles(async event => {
            const filePaths = event.files.map(file => URI.parse(file.uri).fsPath)
            await this.updateContextCommandsOnFileChange(filePaths, true)
        })
        this.lsp.workspace.onDidDeleteFiles(async event => {
            const filePaths = event.files.map(file => URI.parse(file.uri).fsPath)
            await this.updateContextCommandsOnFileChange(filePaths, false)
        })
        this.lsp.workspace.onDidRenameFiles(async event => {
            const oldFiles = event.files.map(file => URI.parse(file.oldUri).fsPath)
            await this.updateContextCommandsOnFileChange(oldFiles, false)
            const newFiles = event.files.map(file => URI.parse(file.newUri).fsPath)
            await this.updateContextCommandsOnFileChange(newFiles, true)
        })
    }

    async updateContextCommandsOnFileChange(filePaths: string[], isAdd: boolean) {
        try {
            const localProjectContextController = await LocalProjectContextController.getInstance()
            const shouldUpdate = await localProjectContextController.shouldUpdateContextCommand(filePaths, isAdd)
            if (shouldUpdate) {
                const contextItems = await localProjectContextController.getContextCommandItems()
                await this.processContextCommandUpdate(contextItems)
            }
        } catch (error) {
            this.logging.error(`Error updating context commands on file change: ${error}`)
        }
    }

    registerPromptFileWatcher() {
        this.promptFileWatcher = watch(getUserPromptsDirectory(), {
            persistent: true,
            interval: 2000,
            ignoreInitial: true,
        })

        this.promptFileWatcher.on('add', async () => {
            await this.processContextCommandUpdate(this.cachedContextCommands ?? [])
        })

        this.promptFileWatcher.on('unlink', async () => {
            await this.processContextCommandUpdate(this.cachedContextCommands ?? [])
        })
    }

    async getUserPromptsCommand(): Promise<ContextCommand[]> {
        const createPromptCommand = {
            command: 'Create a new prompt',
            id: 'create-saved-prompt',
            icon: 'list-add',
        }
        try {
            const userPromptsDirectory = getUserPromptsDirectory()
            const directoryExists = await this.workspace.fs.exists(userPromptsDirectory)
            if (directoryExists) {
                const files = await this.workspace.fs.readdir(userPromptsDirectory)
                const systemPromptFiles = files.filter(file => file.name.endsWith(promptFileExtension))
                const promptCommands = systemPromptFiles.map(
                    file =>
                        ({
                            command: path.basename(file.name, promptFileExtension),
                            icon: 'magic',
                            label: 'file',
                            id: 'prompt',
                            route: [userPromptsDirectory, file.name],
                        }) as ContextCommand
                )
                promptCommands.push(createPromptCommand)
                return promptCommands
            } else {
                return [createPromptCommand]
            }
        } catch (e) {
            this.logging.warn(`Error reading user prompts directory: ${e}`)
            return [createPromptCommand]
        }
    }

    async processContextCommandUpdate(items: ContextCommandItem[]) {
        const allItems = await this.mapContextCommandItems(items)
        this.chat.sendContextCommands({ contextCommandGroups: allItems })
        this.cachedContextCommands = items
    }

    async mapContextCommandItems(items: ContextCommandItem[]): Promise<ContextCommandGroup[]> {
        const folderCmds: ContextCommand[] = []
        const folderCmdGroup: ContextCommand = {
            command: 'Folders',
            children: [
                {
                    groupName: 'Folders',
                    commands: folderCmds,
                },
            ],
            description: 'Add all files in a folder to context',
            icon: 'folder',
        }

        const fileCmds: ContextCommand[] = []
        const fileCmdGroup: ContextCommand = {
            command: 'Files',
            children: [
                {
                    groupName: 'Files',
                    commands: fileCmds,
                },
            ],
            description: 'Add a file to context',
            icon: 'file',
        }

        const codeCmds: ContextCommand[] = []
        const codeCmdGroup: ContextCommand = {
            command: 'Code',
            children: [
                {
                    groupName: 'Code',
                    commands: codeCmds,
                },
            ],
            description: 'Add code to context',
            icon: 'code-block',
        }

        const promptCmds: ContextCommand[] = []
        const promptCmdGroup: ContextCommand = {
            command: 'Prompts',
            children: [
                {
                    groupName: 'Prompts',
                    commands: promptCmds,
                },
            ],
            description: 'Add a saved prompt to context',
            icon: 'magic',
        }
        const workspaceCmd = {
            command: '@workspace',
            description: 'Reference all code in workspace.',
        }
        const commands = [workspaceCmd, folderCmdGroup, fileCmdGroup, codeCmdGroup, promptCmdGroup]
        const allCommands: ContextCommandGroup[] = [
            {
                commands: commands,
            },
        ]

        for (const item of items) {
            const wsFolderName = path.basename(item.workspaceFolder)
            let baseItem = {
                command: path.basename(item.relativePath),
                description: path.join(wsFolderName, item.relativePath),
                route: [item.workspaceFolder, item.relativePath],
                id: item.id,
            }
            if (item.type === 'file') {
                fileCmds.push({
                    ...baseItem,
                    label: 'file',
                    icon: 'file',
                })
            } else if (item.type === 'folder') {
                folderCmds.push({
                    ...baseItem,
                    label: 'folder',
                    icon: 'folder',
                })
            } else if (item.symbol) {
                codeCmds.push({
                    ...baseItem,
                    command: item.symbol.name,
                    description: `${item.symbol.kind}, ${path.join(wsFolderName, item.relativePath)}, L${item.symbol.range.start.line}-${item.symbol.range.end.line}`,
                    label: 'code',
                    icon: 'code-block',
                })
            }
        }
        const userPromptsItem = await this.getUserPromptsCommand()
        promptCmds.push(...userPromptsItem)
        return allCommands
    }

    async maybeUpdateCodeSymbols() {
        const needUpdate = await (
            await LocalProjectContextController.getInstance()
        ).shouldUpdateContextCommandSymbolsOnce()
        if (needUpdate) {
            const items = await (await LocalProjectContextController.getInstance()).getContextCommandItems()
            await this.processContextCommandUpdate(items)
        }
    }

    dispose() {
        void this.promptFileWatcher?.close()
    }
}
