import * as path from 'path'
import { FSWatcher, watch } from 'chokidar'
import { ContextCommand, ContextCommandGroup } from '@aws/language-server-runtimes/protocol'
import { Disposable } from 'vscode-languageclient/node'
import { Chat, Logging, Lsp, Workspace } from '@aws/language-server-runtimes/server-interface'
import { getCodeSymbolDescription, getUserPromptsDirectory, promptFileExtension } from './contextUtils'
import { ContextCommandItem } from 'local-indexing'
import { LocalProjectContextController } from '../../../shared/localProjectContextController'
import { URI } from 'vscode-uri'
import { activeFileCmd } from './additionalContextProvider'

/**
 * Maximum number of context command items sent to the webview in a single payload.
 * Large repos can have 100k+ items; sending all of them causes massive serialization
 * overhead and memory growth. Items beyond this cap are still cached locally but
 * not serialized to the webview.
 */
export const CONTEXT_COMMAND_PAYLOAD_CAP = 10_000

/**
 * Number of static commands added by mapContextCommandItems (e.g., "Active File",
 * user prompt commands) that are always present regardless of input items.
 * Subtracted from the cap so the total items in the payload (including static
 * commands) stays within CONTEXT_COMMAND_PAYLOAD_CAP.
 */
const STATIC_COMMAND_HEADROOM = 100

/**
 * Throttle window (in ms) for coalescing rapid `onIndexingInProgressChanged`
 * callbacks.  When indexing status toggles rapidly (e.g. true→false→true),
 * only the final state triggers a `processContextCommandUpdate` call after
 * this delay elapses with no further changes.
 */
export const INDEXING_THROTTLE_MS = 500

export class ContextCommandsProvider implements Disposable {
    private promptFileWatcher?: FSWatcher
    private cachedContextCommands?: ContextCommandItem[]
    private codeSymbolsPending = true
    private codeSymbolsFailed = false
    private filesAndFoldersPending = true
    private filesAndFoldersFailed = false
    private workspacePending = true
    private initialStateSent = false
    /** Handle for the pending indexing-change throttle timer */
    private indexingThrottleTimer?: ReturnType<typeof setTimeout>
    constructor(
        private readonly logging: Logging,
        private readonly chat: Chat,
        private readonly workspace: Workspace,
        private readonly lsp: Lsp
    ) {
        this.registerPromptFileWatcher()
        this.registerContextCommandHandler().catch(e =>
            this.logging.error(`Error registering context command handler: ${e}`)
        )
    }

    onReady() {
        if (!this.initialStateSent) {
            this.initialStateSent = true
            void this.processContextCommandUpdate([]).catch(e =>
                this.logging.error(`Failed to send initial context commands: ${e}`)
            )
        }
    }

    private async registerContextCommandHandler() {
        try {
            const controller = await LocalProjectContextController.getInstance()
            controller.onContextItemsUpdated = async contextItems => {
                await this.processContextCommandUpdate(contextItems)
            }
            controller.onIndexingInProgressChanged = (indexingInProgress: boolean) => {
                if (this.workspacePending !== indexingInProgress) {
                    this.workspacePending = indexingInProgress

                    // Coalesce rapid indexing status toggles: cancel any pending
                    // throttle timer and start a new one.  Only the final state
                    // after the throttle window triggers processContextCommandUpdate.
                    if (this.indexingThrottleTimer !== undefined) {
                        clearTimeout(this.indexingThrottleTimer)
                    }
                    this.indexingThrottleTimer = setTimeout(async () => {
                        this.indexingThrottleTimer = undefined
                        try {
                            const items = await controller.getContextCommandItems()
                            await this.processContextCommandUpdate(items)
                        } catch {
                            void this.processContextCommandUpdate(this.cachedContextCommands ?? [])
                        }
                    }, INDEXING_THROTTLE_MS)
                }
            }
        } catch (e) {
            this.logging.warn(`Error processing context command update: ${e}`)
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
        // Cache the full item list so subsequent operations (e.g., indexing updates)
        // have access to all items regardless of the payload cap.
        this.cachedContextCommands = items

        // Cap the items sent to the webview to avoid massive serialization and memory overhead.
        // Small repos (below the cap) send everything as before.
        // Leave headroom for static commands (e.g., "Active File", prompt commands) added
        // by mapContextCommandItems so the total payload stays within CONTEXT_COMMAND_PAYLOAD_CAP.
        const effectiveCap = CONTEXT_COMMAND_PAYLOAD_CAP - STATIC_COMMAND_HEADROOM
        const cappedItems = items.length > effectiveCap ? items.slice(0, effectiveCap) : items

        const allItems = await this.mapContextCommandItems(cappedItems)
        this.chat.sendContextCommands({ contextCommandGroups: allItems })
    }

    async mapContextCommandItems(items: ContextCommandItem[]): Promise<ContextCommandGroup[]> {
        let imageContextEnabled =
            this.lsp.getClientInitializeParams()?.initializationOptions?.aws?.awsClientCapabilities?.q
                ?.imageContextEnabled === true
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
            disabledText: this.filesAndFoldersFailed ? 'failed' : this.filesAndFoldersPending ? 'pending' : undefined,
        }

        const fileCmds: ContextCommand[] = [activeFileCmd]
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
            disabledText: this.filesAndFoldersFailed ? 'failed' : this.filesAndFoldersPending ? 'pending' : undefined,
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
            disabledText: this.codeSymbolsFailed ? 'failed' : this.codeSymbolsPending ? 'pending' : undefined,
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

        const imageCmdGroup: ContextCommand = {
            command: 'Image',
            description: 'Add image to context',
            icon: 'image',
            placeholder: 'Select an image file',
        }

        const workspaceCmd: ContextCommand = {
            command: '@workspace',
            id: '@workspace',
            description: 'Reference all code in workspace',
            disabledText: this.workspacePending ? 'pending' : undefined,
        }
        const commands = [workspaceCmd, folderCmdGroup, fileCmdGroup, codeCmdGroup, promptCmdGroup]

        if (imageContextEnabled) {
            commands.push(imageCmdGroup)
        }

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
                    description: getCodeSymbolDescription(item, true),
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
        try {
            const needUpdate = await (
                await LocalProjectContextController.getInstance()
            ).shouldUpdateContextCommandSymbolsOnce()
            if (needUpdate) {
                this.codeSymbolsPending = false
                const items = await (await LocalProjectContextController.getInstance()).getContextCommandItems()
                await this.processContextCommandUpdate(items)
            }
        } catch (error) {
            this.codeSymbolsFailed = true
            this.codeSymbolsPending = false
            await this.processContextCommandUpdate(this.cachedContextCommands ?? [])
            throw error
        }
    }

    setFilesAndFoldersPending(value: boolean) {
        this.filesAndFoldersPending = value
    }

    setFilesAndFoldersFailed(value: boolean) {
        this.filesAndFoldersFailed = value
        if (value) {
            this.filesAndFoldersPending = false
        }
    }

    dispose() {
        if (this.indexingThrottleTimer !== undefined) {
            clearTimeout(this.indexingThrottleTimer)
        }
        void this.promptFileWatcher?.close()
    }
}
