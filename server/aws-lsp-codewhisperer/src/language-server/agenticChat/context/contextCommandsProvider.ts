import * as path from 'path'
import { FSWatcher, watch } from 'chokidar'
import { Features } from '../../types'
import { ContextCommand, ContextCommandGroup } from '@aws/language-server-runtimes/protocol'
import { TriggerContext } from '../../chat/contexts/triggerContext'
import { URI } from 'vscode-uri'
import { getUserHomeDir } from '@aws/lsp-core/out/util/path'
import { Disposable } from 'vscode-languageclient/node'

export type AdditionalContextLengths = {
    fileContextLength: number
    promptContextLength: number
    ruleContextLength: number
}

export class ContextCommandsProvider implements Disposable {
    private promptFileWatcher?: FSWatcher
    private promptFileExtension = '.prompt.md'
    constructor(private readonly features: Features) {
        this.registerPromptFileWatcher()
    }
    getUserPromptsDirectory = () => {
        return path.join(getUserHomeDir(), '.aws', 'amazonq', 'prompts')
    }

    registerPromptFileWatcher() {
        this.promptFileWatcher = watch(this.getUserPromptsDirectory(), {
            persistent: true,
            interval: 2000,
            ignoreInitial: true,
        })

        this.promptFileWatcher.on('add', () => {
            void this.processContextCommandUpdate()
        })

        this.promptFileWatcher.on('unlink', () => {
            void this.processContextCommandUpdate()
        })
    }

    async getUserPromptsCommand() {
        const userPromptsCommandGroup: ContextCommandGroup = {
            groupName: 'Prompts',
            commands: [],
        }
        try {
            const userPromptsDirectory = this.getUserPromptsDirectory()
            const directoryExists = await this.features.workspace.fs.exists(userPromptsDirectory)
            if (directoryExists) {
                const files = await this.features.workspace.fs.readdir(userPromptsDirectory)
                const systemPromptFiles = files.filter(file => file.name.endsWith(this.promptFileExtension))
                const promptCommands = systemPromptFiles.map(
                    file =>
                        ({
                            command: file.name,
                            icon: 'magic',
                            label: 'file',
                        }) as ContextCommand
                )
                userPromptsCommandGroup.commands.push(...promptCommands)
            }
        } catch (e) {
            // TODO: handle error
        }

        // Add create prompt button to the bottom of the prompts list
        userPromptsCommandGroup.commands.push({
            command: 'Create a new prompt',
            id: 'create-saved-prompt',
            icon: 'list-add',
        })

        return userPromptsCommandGroup
    }

    async handleCreatePrompt(promptName: string) {
        const userPromptsDirectory = this.getUserPromptsDirectory()
        const newFilePath = path.join(
            userPromptsDirectory,
            promptName ? `${promptName}${this.promptFileExtension}` : `default${this.promptFileExtension}`
        )
        const newFileContent = ''
        try {
            await this.features.workspace.fs.writeFile(
                newFilePath,
                newFileContent
                // { mode: 0o600 }
            )
        } catch (e) {
            // TODO: handle error
        }
        await this.features.lsp.window.showDocument({ uri: newFilePath })
        void this.processContextCommandUpdate()
    }

    async addAdditionalContext(triggerContext: TriggerContext) {
        let workspaceRulesCommands: ContextCommand[] = []
        const workspaceRules = await this.collectWorkspaceRules(triggerContext)
        if (workspaceRules.length > 0) {
            workspaceRulesCommands = workspaceRules.map(
                file =>
                    ({
                        command: path.basename(file),
                        description: file,
                        icon: 'magic',
                        label: 'file',
                    }) as ContextCommand
            )
        }
        triggerContext.workspaceRulesCount = workspaceRules.length
        // TODO: get context command prompt from project context server and pass to api request
    }

    async collectWorkspaceRules(triggerContext: TriggerContext): Promise<string[]> {
        const rulesFiles: string[] = []
        const folder = triggerContext.workspaceFolder
        if (!folder) {
            return rulesFiles
        }
        const workspaceRoot = folder.uri ? URI.parse(folder.uri).fsPath : process.cwd()
        const rulesPath = path.join(workspaceRoot, '.amazonq', 'rules')
        const folderExists = await this.features.workspace.fs.exists(rulesPath)

        if (folderExists) {
            const entries = await this.features.workspace.fs.readdir(rulesPath)

            for (const entry of entries) {
                if (entry.isFile() && entry.name.endsWith(this.promptFileExtension)) {
                    rulesFiles.push(path.join(rulesPath, entry.name))
                }
            }
        }
        return rulesFiles
    }

    async processContextCommandUpdate() {
        const userPromptsItem = await this.getUserPromptsCommand()
        this.features.chat.sendContextCommands({ contextCommandGroups: [userPromptsItem] })
    }

    dispose() {
        void this.promptFileWatcher?.close()
    }
}
