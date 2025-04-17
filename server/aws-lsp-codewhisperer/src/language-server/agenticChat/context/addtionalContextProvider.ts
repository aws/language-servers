import { FileDetails, QuickActionCommand, FileList } from '@aws/language-server-runtimes/protocol'
import { AdditionalContextPrompt, ContextCommandItem, ContextCommandItemType } from 'local-indexing'
import * as path from 'path'
import { AdditionalContentEntryAddition, TriggerContext } from './agenticChatTriggerContext'
import { URI } from 'vscode-uri'
import { Workspace } from '@aws/language-server-runtimes/server-interface'
import { pathUtils } from '@aws/lsp-core'
import {
    additionalContentInnerContextLimit,
    additionalContentNameLimit,
    getUserPromptsDirectory,
    promptFileExtension,
} from './contextUtils'
import { LocalProjectContextController } from '../../../shared/localProjectContextController'

export class AdditionalContextProvider {
    constructor(private readonly workspace: Workspace) {}

    async collectWorkspaceRules(triggerContext: TriggerContext): Promise<string[]> {
        const rulesFiles: string[] = []
        const folder = triggerContext.workspaceFolder
        if (!folder) {
            return rulesFiles
        }
        const workspaceRoot = folder.uri ? URI.parse(folder.uri).fsPath : process.cwd()
        const rulesPath = path.join(workspaceRoot, '.amazonq', 'rules')
        const folderExists = await this.workspace.fs.exists(rulesPath)

        if (folderExists) {
            const entries = await this.workspace.fs.readdir(rulesPath)

            for (const entry of entries) {
                if (entry.isFile() && entry.name.endsWith(promptFileExtension)) {
                    rulesFiles.push(path.join(rulesPath, entry.name))
                }
            }
        }
        return rulesFiles
    }

    getContextType(prompt: AdditionalContextPrompt): string {
        if (prompt.filePath.endsWith(promptFileExtension)) {
            if (pathUtils.isInDirectory(path.join('.amazonq', 'rules'), prompt.relativePath)) {
                return 'rule'
            } else if (pathUtils.isInDirectory(getUserPromptsDirectory(), prompt.filePath)) {
                return 'prompt'
            }
        }
        return 'file'
    }

    async getAdditionalContext(
        triggerContext: TriggerContext,
        context?: any[]
    ): Promise<AdditionalContentEntryAddition[]> {
        const additionalContextCommands: ContextCommandItem[] = []
        const workspaceRules = await this.collectWorkspaceRules(triggerContext)
        let workspaceFolderPath = triggerContext.workspaceFolder?.uri
            ? URI.parse(triggerContext.workspaceFolder.uri).fsPath
            : process.cwd()

        if (workspaceRules.length > 0) {
            additionalContextCommands.push(
                ...workspaceRules.map(
                    file =>
                        ({
                            workspaceFolder: workspaceFolderPath,
                            type: 'file',
                            relativePath: path.relative(workspaceFolderPath, file),
                            id: '',
                        }) as ContextCommandItem
                )
            )
        }
        triggerContext.workspaceRulesCount = workspaceRules.length
        if (context) {
            additionalContextCommands.push(...this.mapToContextCommandItems(context, workspaceFolderPath))
        }

        if (additionalContextCommands.length === 0) {
            return []
        }

        const prompts =
            await LocalProjectContextController.getInstance().getContextCommandPrompt(additionalContextCommands)

        const contextEntry: AdditionalContentEntryAddition[] = []
        for (const prompt of prompts.slice(0, 20)) {
            const contextType = this.getContextType(prompt)
            const description =
                contextType === 'rule' || contextType === 'prompt'
                    ? `You must follow the instructions in ${prompt.relativePath}. Below are lines ${prompt.startLine}-${prompt.endLine} of this file:\n`
                    : prompt.description

            const relativePath = prompt.filePath.startsWith(getUserPromptsDirectory())
                ? path.basename(prompt.filePath)
                : path.relative(workspaceFolderPath, prompt.filePath)

            const entry = {
                name: prompt.name.substring(0, additionalContentNameLimit),
                description: description.substring(0, additionalContentNameLimit),
                innerContext: prompt.content.substring(0, additionalContentInnerContextLimit),
                type: contextType,
                relativePath: relativePath,
                startLine: prompt.startLine,
                endLine: prompt.endLine,
            }

            contextEntry.push(entry)
        }
        return contextEntry
    }

    getFileListFromContext(context: AdditionalContentEntryAddition[]): FileList {
        const fileDetails: Record<string, FileDetails> = {}
        for (const item of context) {
            fileDetails[item.relativePath] = {
                lineRanges: [
                    {
                        first: item.name === 'symbol' ? item.startLine : -1,
                        second: item.name === 'symbol' ? item.endLine : -1,
                    },
                ],
            }
        }
        const fileList: FileList = {
            filePaths: context.map(item => item.relativePath),
            details: fileDetails,
        }
        return fileList
    }

    mapToContextCommandItems(context: any[], workspaceFolderPath: string): ContextCommandItem[] {
        const contextCommands: ContextCommandItem[] = []
        for (const item of context) {
            let itemType: ContextCommandItemType | undefined
            if (item.icon === 'file') {
                itemType = 'file'
            } else if (item.icon === 'folder') {
                itemType = 'folder'
            } else if (item.icon === 'code-block') {
                itemType = 'code'
            }
            if (itemType) {
                contextCommands.push({
                    workspaceFolder: workspaceFolderPath,
                    type: itemType,
                    relativePath: item.command,
                    id: item.id,
                })
            }
        }
        return contextCommands
    }
}
