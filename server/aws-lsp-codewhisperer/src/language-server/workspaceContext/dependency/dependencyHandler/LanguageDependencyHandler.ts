import { Logging, Workspace, WorkspaceFolder } from '@aws/language-server-runtimes/server-interface'
import { CodewhispererLanguage } from '../../../languageDetection'

export interface Dependency {
    name: string
    version: string
    path: string
}

export interface BaseDependencyInfo {
    pkgDir: string
}

// Abstract base class for all language dependency handlers
export abstract class LanguageDependencyHandler<T extends BaseDependencyInfo> {
    public language: CodewhispererLanguage
    protected workspace: Workspace
    protected logging: Logging
    protected workspaceFolders: WorkspaceFolder[]
    protected dependencyMap: Map<string, Dependency>

    constructor(
        language: CodewhispererLanguage,
        workspace: Workspace,
        logging: Logging,
        workspaceFolders: WorkspaceFolder[]
    ) {
        this.language = language
        this.workspace = workspace
        this.logging = logging
        this.workspaceFolders = workspaceFolders
        this.dependencyMap = new Map()
    }

    /*
     * This function is to discover heuristics of dependency locations of programming languages.
     */
    abstract discover(currentDir: string): boolean

    /*
     * This function is to create dependency map of programming languages. The key is the dependency name
     */
    abstract createDependencyMap(): Map<string, Dependency>

    protected log(message: string): void {
        this.logging.log(message)
    }
}
