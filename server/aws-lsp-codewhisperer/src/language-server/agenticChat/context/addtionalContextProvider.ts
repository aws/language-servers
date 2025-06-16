import {
    FileDetails,
    FileList,
    ContextCommand,
    ListRulesParams,
    ListRulesResult,
    RuleClickParams,
    RuleClickResult,
    RulesFolder,
    PinnedContextParams,
} from '@aws/language-server-runtimes/protocol'
import { AdditionalContextPrompt, ContextCommandItem, ContextCommandItemType } from 'local-indexing'
import * as path from 'path'
import {
    AdditionalContentEntryAddition,
    additionalContextMaxLength,
    TriggerContext,
    workspaceChunkMaxSize,
} from './agenticChatTriggerContext'
import { URI } from 'vscode-uri'
import { pathUtils, workspaceUtils } from '@aws/lsp-core'
import {
    additionalContentNameLimit,
    getUserPromptsDirectory,
    getInitialContextInfo,
    promptFileExtension,
} from './contextUtils'
import { LocalProjectContextController } from '../../../shared/localProjectContextController'
import { Features } from '../../types'
import { ChatDatabase } from '../tools/chatDb/chatDb'

export const ACTIVE_EDITOR_CONTEXT_ID = 'active-editor'

export const activeFileCmd = {
    command: 'Active file',
    id: ACTIVE_EDITOR_CONTEXT_ID,
    icon: 'file',
    description: 'Reference active text file',
}

type ContextCommandInfo = ContextCommand & { pinned: boolean }

/**
 * AdditionalContextProvider manages context information for Amazon Q chat sessions.
 * It handles workspace rules, pinned context, and file context for chat interactions.
 * The provider retrieves available rules whenever requested by the client.
 */
export class AdditionalContextProvider {
    private totalRulesCount: number = 0

    constructor(
        private readonly features: Features,
        private readonly chatDb: ChatDatabase
    ) {}

    /**
     * Recursively collects markdown files from a directory and its subdirectories
     * @param workspaceFolder The root workspace folder path
     * @param dirPath The directory to search in
     * @param rulesFiles Array to collect the found files
     */
    private async collectMarkdownFilesRecursively(
        workspaceFolder: string,
        dirPath: string,
        rulesFiles: ContextCommandItem[]
    ): Promise<void> {
        const entries = await this.features.workspace.fs.readdir(dirPath)

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name)

            if (entry.isDirectory()) {
                // Recursively search subdirectories
                await this.collectMarkdownFilesRecursively(workspaceFolder, fullPath, rulesFiles)
            } else if (entry.isFile() && entry.name.endsWith(promptFileExtension)) {
                // Add markdown file to the list
                const relativePath = path.relative(workspaceFolder, fullPath)
                rulesFiles.push({
                    workspaceFolder: workspaceFolder,
                    type: 'file',
                    relativePath,
                    id: fullPath,
                })
            }
        }
    }

    /**
     * Internal method to collect workspace rules without tab filtering
     */
    private async collectWorkspaceRulesInternal(): Promise<ContextCommandItem[]> {
        const rulesFiles: ContextCommandItem[] = []
        let workspaceFolders = workspaceUtils.getWorkspaceFolderPaths(this.features.workspace)

        if (!workspaceFolders.length) {
            return rulesFiles
        }

        for (const workspaceFolder of workspaceFolders) {
            // Check for rules in .amazonq/rules directory and its subdirectories
            const rulesPath = path.join(workspaceFolder, '.amazonq', 'rules')
            const folderExists = await this.features.workspace.fs.exists(rulesPath)

            if (folderExists) {
                await this.collectMarkdownFilesRecursively(workspaceFolder, rulesPath, rulesFiles)
            }

            // Check for README.md in workspace root
            const readmePath = path.join(workspaceFolder, 'README.md')
            const readmeExists = await this.features.workspace.fs.exists(readmePath)
            if (readmeExists) {
                rulesFiles.push({
                    workspaceFolder: workspaceFolder,
                    type: 'file',
                    relativePath: 'README.md',
                    id: readmePath,
                })
            }

            // Check for AmazonQ.md in workspace root
            const amazonQPath = path.join(workspaceFolder, 'AmazonQ.md')
            const amazonQExists = await this.features.workspace.fs.exists(amazonQPath)
            if (amazonQExists) {
                rulesFiles.push({
                    workspaceFolder: workspaceFolder,
                    type: 'file',
                    relativePath: 'AmazonQ.md',
                    id: amazonQPath,
                })
            }
        }

        return rulesFiles
    }

    async collectWorkspaceRules(tabId?: string): Promise<ContextCommandItem[]> {
        // Always collect rules directly from the filesystem
        const rulesFiles = await this.collectWorkspaceRulesInternal()
        this.totalRulesCount = rulesFiles.length

        // If no tabId, return all rules without filtering
        if (!tabId) {
            return rulesFiles
        }

        // Filter rules based on user's rules preferences for current tab
        let rulesState = this.chatDb.getRules(tabId) || { folders: {}, rules: {} }
        return rulesFiles.filter(rule => {
            // If the rule has an explicit state in rulesState, use that value
            if (rulesState.rules[rule.id] !== undefined) {
                return rulesState.rules[rule.id]
            }

            // Otherwise, check the parent folder's state
            const dirPath = path.dirname(rule.relativePath)
            const folderName = dirPath === '.' ? '' : dirPath

            // If folder state is explicitly set to false, the rule inherits that state
            if (rulesState.folders[folderName] === false) {
                return false
            }

            // Default to true for all other cases
            return true
        })
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
        tabId: string,
        context?: ContextCommand[]
    ): Promise<AdditionalContentEntryAddition[]> {
        triggerContext.contextInfo = getInitialContextInfo()

        const additionalContextCommands: ContextCommandItem[] = []
        const workspaceRules = await this.collectWorkspaceRules(tabId)
        let workspaceFolderPath = triggerContext.workspaceFolder?.uri
            ? URI.parse(triggerContext.workspaceFolder.uri).fsPath
            : workspaceUtils.getWorkspaceFolderPaths(this.features.workspace)[0]

        if (workspaceRules.length > 0) {
            additionalContextCommands.push(...workspaceRules)
        }

        // Merge pinned context with context added to prompt, avoiding duplicates
        let contextInfo: ContextCommandInfo[] = (context?.map(item => ({ ...item, pinned: false })) || []).concat(
            this.chatDb
                .getPinnedContext(tabId)
                .filter(item => !context?.find(innerItem => item.id === innerItem.id))
                .map(item => ({ ...item, pinned: true }))
        )
        // If Active File context pill was removed from pinned context, remove it from payload
        if (!contextInfo?.find(item => item.id === ACTIVE_EDITOR_CONTEXT_ID)) {
            triggerContext.text = undefined
            triggerContext.cursorState = undefined
        } else {
            // Remove Active File from context list since its contents have already been added to triggerContext.text
            contextInfo = contextInfo.filter(item => item.id !== ACTIVE_EDITOR_CONTEXT_ID)
        }

        if (contextInfo.some(item => item.id === '@workspace')) {
            triggerContext.hasWorkspace = true
        }

        const contextCounts = getInitialContextInfo()

        additionalContextCommands.push(...this.mapToContextCommandItems(contextInfo, workspaceFolderPath))
        for (const c of contextInfo) {
            if (c.id === 'prompt') {
                c.pinned
                    ? contextCounts.pinnedContextCount.promptContextCount++
                    : contextCounts.contextCount.promptContextCount++
            } else if (c.label === 'file') {
                c.pinned
                    ? contextCounts.pinnedContextCount.fileContextCount++
                    : contextCounts.contextCount.fileContextCount++
            } else if (c.label === 'folder') {
                c.pinned
                    ? contextCounts.pinnedContextCount.folderContextCount++
                    : contextCounts.contextCount.folderContextCount++
            } else if (c.label === 'code') {
                c.pinned
                    ? contextCounts.pinnedContextCount.codeContextCount++
                    : contextCounts.contextCount.codeContextCount++
            }
        }
        triggerContext.contextInfo = {
            ...triggerContext.contextInfo,
            contextCount: {
                ...contextCounts.contextCount,
                activeRuleContextCount: workspaceRules.length,
                totalRuleContextCount: this.totalRulesCount,
            },

            pinnedContextCount: contextCounts.pinnedContextCount,
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

    sendPinnedContext(tabId: string): void {
        let pinnedContextEnabled =
            this.features.lsp.getClientInitializeParams()?.initializationOptions?.aws?.awsClientCapabilities?.q
                ?.pinnedContextEnabled === true
        if (pinnedContextEnabled) {
            let pinnedContext = this.chatDb.getPinnedContext(tabId)
            this.features.chat.sendPinnedContext({
                tabId,
                contextCommandGroups: [
                    {
                        commands: pinnedContext,
                    },
                ],
                showRules: workspaceUtils.getWorkspaceFolderPaths(this.features.workspace).length > 0,
            })
        }
    }

    async getRulesFolders(tabId: string): Promise<RulesFolder[]> {
        const workspaceRules = await this.collectWorkspaceRules()
        return this.convertRulesToRulesFolders(workspaceRules, tabId)
    }

    async onRuleClick(params: RuleClickParams): Promise<RuleClickResult> {
        let rulesState = { ...this.chatDb.getRules(params.tabId) }
        if (params.type === 'folder') {
            // Get current state (default to true if not set)
            const currentActive = rulesState.folders[params.id] !== false
            // Toggle the state
            rulesState.folders[params.id] = !currentActive

            // Get all rules in this folder to update their states
            const rulesFolders = await this.getRulesFolders(params.tabId)
            const folder = rulesFolders.find(folder => folder.folderName === params.id)

            if (folder && folder.rules) {
                // Update all rules in this folder to match folder state
                folder.rules.forEach(rule => {
                    rulesState.rules[rule.id] = !currentActive
                })
            }
            this.chatDb.setRules(params.tabId, rulesState)

            return { ...params, success: true }
        } else if (params.type === 'rule') {
            // Get current state (default to true if not set)
            const currentActive = rulesState.rules[params.id] !== false
            // Toggle the state
            rulesState.rules[params.id] = !currentActive

            // Check if we need to update parent folder state
            const rulesFolders = await this.getRulesFolders(params.tabId)
            const folder = rulesFolders.find(folder => folder.rules.some(rule => rule.id === params.id))

            if (folder) {
                // Check if all rules in folder are now active/inactive
                const allRulesInFolder = folder.rules.map(r => r.id)
                const activeRulesCount = allRulesInFolder.filter(ruleId => rulesState.rules[ruleId] !== false).length

                // Update folder state based on its rules
                if (activeRulesCount === 0) {
                    rulesState.folders[folder.folderName || ''] = false
                } else if (activeRulesCount === allRulesInFolder.length) {
                    rulesState.folders[folder.folderName || ''] = true
                }
            }
            this.chatDb.setRules(params.tabId, rulesState)

            return { ...params, success: true }
        }

        return { ...params, success: false }
    }

    async onListRules(params: ListRulesParams): Promise<ListRulesResult> {
        return {
            tabId: params.tabId,
            rules: await this.getRulesFolders(params.tabId),
        }
    }

    onPinnedContextAdd(params: PinnedContextParams) {
        // add to this.#pinnedContext if that id isnt already in there
        let itemToAdd = params.contextCommandGroups[0]?.commands?.[0]
        if (itemToAdd) {
            this.chatDb.addPinnedContext(params.tabId, itemToAdd)
        }
        this.sendPinnedContext(params.tabId)
    }

    onPinnedContextRemove(params: PinnedContextParams) {
        let itemToRemove = params.contextCommandGroups[0]?.commands?.[0]
        if (itemToRemove) {
            this.chatDb.removePinnedContext(params.tabId, itemToRemove)
        }
        this.sendPinnedContext(params.tabId)
    }

    private convertRulesToRulesFolders(workspaceRules: ContextCommandItem[], tabId: string): RulesFolder[] {
        // Check if there's only one workspace folder
        const workspaceFolders = workspaceUtils.getWorkspaceFolderPaths(this.features.workspace)
        const isSingleWorkspace = workspaceFolders.length <= 1

        // Group rules by their parent folder
        const folderMap = new Map<string, ContextCommandItem[]>()

        for (const rule of workspaceRules) {
            // Extract the folder path from the relativePath
            let folderName: string | undefined

            // Get directory path
            const dirPath = path.dirname(rule.relativePath)

            if (isSingleWorkspace) {
                // In single workspace: root files have undefined folder name
                if (dirPath === '.') {
                    folderName = undefined
                } else {
                    folderName = dirPath
                }
            } else {
                // In multi-workspace: include workspace folder name for all files
                // Root files will use the workspace folder name
                // Subdir files will use workspace folder name + subdir
                const workspaceFolderName = path.basename(rule.workspaceFolder)
                folderName = dirPath === '.' ? workspaceFolderName : `${workspaceFolderName}/${dirPath}`
            }

            // Get or create the folder's rule list
            const folderRules = folderMap.get(folderName || '') || []
            folderRules.push(rule)
            folderMap.set(folderName || '', folderRules)
        }

        // Convert the map to RulesFolder array
        const rulesFolders: RulesFolder[] = []
        let rulesState = this.chatDb.getRules(tabId)
        for (const [folderName, rules] of folderMap.entries()) {
            // Map rules to their active states
            const ruleStates = rules.map(rule => {
                const ruleId = rule.id
                // For rule active state:
                // 1. If explicitly set in rules map, use that value
                // 2. Otherwise, new rules are active by default
                const folderDefaultState =
                    rulesState.folders[folderName] !== undefined ? rulesState.folders[folderName] : true

                return rulesState.rules[ruleId] !== undefined ? rulesState.rules[ruleId] : folderDefaultState
            })

            // Determine folder active state
            let folderActive: boolean | 'indeterminate'

            // If explicitly set in folders map, start with that value
            if (rulesState.folders[folderName] !== undefined) {
                folderActive = rulesState.folders[folderName]
            } else {
                // Default to true for new folders
                folderActive = true
            }

            // Check if we need to set indeterminate state
            // Count active and inactive rules
            const activeRules = ruleStates.filter(state => state === true).length
            const inactiveRules = ruleStates.filter(state => state === false).length

            // If there are both active and inactive rules, set to indeterminate
            if (activeRules > 0 && inactiveRules > 0) {
                folderActive = 'indeterminate'
            }

            const rulesFolder: RulesFolder = {
                folderName: folderName || undefined,
                active: folderActive,
                rules: rules.map((rule, index) => {
                    return {
                        name: path.basename(rule.relativePath, promptFileExtension),
                        active: ruleStates[index],
                        id: rule.id,
                    }
                }),
            }

            rulesFolders.push(rulesFolder)
        }

        // Sort the folders: undefined folderName first, then alphabetically
        rulesFolders.sort((a, b) => {
            // If a has undefined folderName, it should come first
            if (a.folderName === undefined) {
                return -1
            }
            // If b has undefined folderName, it should come first
            if (b.folderName === undefined) {
                return 1
            }
            // Otherwise sort alphabetically
            return a.folderName.localeCompare(b.folderName)
        })

        return rulesFolders
    }
}
