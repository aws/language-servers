import { FileDetails, QuickActionCommand, FileList, ContextCommand } from '@aws/language-server-runtimes/protocol'
import { AdditionalContextPrompt, ContextCommandItem, ContextCommandItemType } from 'local-indexing'
import * as path from 'path'
import {
    AdditionalContentEntryAddition,
    additionalContextMaxLength,
    TriggerContext,
    workspaceChunkMaxSize,
} from './agenticChatTriggerContext'
import { URI } from 'vscode-uri'
import { Workspace } from '@aws/language-server-runtimes/server-interface'
import { pathUtils, workspaceUtils } from '@aws/lsp-core'
import {
    additionalContentNameLimit,
    getUserPromptsDirectory,
    initialContextInfo,
    promptFileExtension,
} from './contextUtils'
import { LocalProjectContextController } from '../../../shared/localProjectContextController'

export class AdditionalContextProvider {
    constructor(private readonly workspace: Workspace) {}

    async collectWorkspaceRules(): Promise<ContextCommandItem[]> {
        const rulesFiles: ContextCommandItem[] = []
        let workspaceFolders = workspaceUtils.getWorkspaceFolderPaths(this.workspace)

        if (!workspaceFolders.length) {
            return rulesFiles
        }
        for (const workspaceFolder of workspaceFolders) {
            const rulesPath = path.join(workspaceFolder, '.amazonq', 'rules')
            const folderExists = await this.workspace.fs.exists(rulesPath)

            if (folderExists) {
                const entries = await this.workspace.fs.readdir(rulesPath)

                for (const entry of entries) {
                    if (entry.isFile() && entry.name.endsWith(promptFileExtension)) {
                        rulesFiles.push({
                            workspaceFolder: workspaceFolder,
                            type: 'file',
                            relativePath: path.relative(workspaceFolder, path.join(rulesPath, entry.name)),
                            id: '',
                        })
                    }
                }
            }
        }
        return rulesFiles
    }

    getContextType(prompt: AdditionalContextPrompt): string {
        if (prompt.name === 'symbol') {
            return 'code'
        }
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
        context?: ContextCommand[]
    ): Promise<AdditionalContentEntryAddition[]> {
        if (!triggerContext.contextInfo) {
            triggerContext.contextInfo = initialContextInfo
        }
        const additionalContextCommands: ContextCommandItem[] = []
        const workspaceRules = await this.collectWorkspaceRules()
        let workspaceFolderPath = triggerContext.workspaceFolder?.uri
            ? URI.parse(triggerContext.workspaceFolder.uri).fsPath
            : workspaceUtils.getWorkspaceFolderPaths(this.workspace)[0]

        if (workspaceRules.length > 0) {
            additionalContextCommands.push(...workspaceRules)
        }
        triggerContext.contextInfo.contextCount.ruleContextCount = workspaceRules.length
        if (context) {
            let fileContextCount = 0
            let folderContextCount = 0
            let promptContextCount = 0
            let codeContextCount = 0
            additionalContextCommands.push(...this.mapToContextCommandItems(context, workspaceFolderPath))
            for (const c of context) {
                if (typeof context !== 'string') {
                    if (c.id === 'prompt') {
                        promptContextCount++
                    } else if (c.label === 'file') {
                        fileContextCount++
                    } else if (c.label === 'folder') {
                        folderContextCount++
                    } else if (c.label === 'code') {
                        codeContextCount++
                    }
                }
            }
            triggerContext.contextInfo!.contextCount = {
                ...triggerContext.contextInfo!.contextCount,
                fileContextCount,
                folderContextCount,
                promptContextCount,
                codeContextCount,
            }
        }

        if (additionalContextCommands.length === 0) {
            return []
        }

        let prompts: AdditionalContextPrompt[] = []
        try {
            const localProjectContextController = await LocalProjectContextController.getInstance()
            prompts = await localProjectContextController.getContextCommandPrompt(additionalContextCommands)
        } catch (error) {
            // do nothing
        }

        const contextEntry: AdditionalContentEntryAddition[] = []
        let ruleContextLength = 0
        let fileContextLength = 0
        let promptContextLength = 0
        let codeContextLength = 0
        for (const prompt of prompts.slice(0, additionalContextMaxLength)) {
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
                innerContext: prompt.content.substring(0, workspaceChunkMaxSize),
                type: contextType,
                path: prompt.filePath,
                relativePath: relativePath,
                startLine: prompt.startLine,
                endLine: prompt.endLine,
            }
            contextEntry.push(entry)

            if (contextType === 'rule') {
                ruleContextLength += prompt.content.length
            } else if (contextType === 'prompt') {
                promptContextLength += prompt.content.length
            } else if (contextType === 'code') {
                codeContextLength += prompt.content.length
            } else {
                fileContextLength += prompt.content.length
            }
        }
        triggerContext.contextInfo.contextLength = {
            ruleContextLength,
            fileContextLength,
            promptContextLength,
            codeContextLength,
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
                description: item.path,
                fullPath: item.path,
            }
        }
        const fileList: FileList = {
            filePaths: [...new Set(context.map(item => item.relativePath))],
            details: fileDetails,
        }
        return fileList
    }

    mapToContextCommandItems(context: ContextCommand[], workspaceFolderPath: string): ContextCommandItem[] {
        const contextCommands: ContextCommandItem[] = []
        for (const item of context) {
            if (item.route && item.route.length === 2) {
                contextCommands.push({
                    workspaceFolder: item.route?.[0] ?? workspaceFolderPath,
                    type: item.label ?? '',
                    relativePath: item.route?.[1] ?? '',
                    id: item.id ?? '',
                } as ContextCommandItem)
            }
        }
        return contextCommands
    }
}
