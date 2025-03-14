import { JavaDependencyHandler } from './JavaDependencyHandler'
import { PythonDependencyHandler } from './PythonDependencyHandler'
import { JSTSDependencyHandler } from './JSTSDependencyHandler'
import { BaseDependencyInfo, LanguageDependencyHandler } from './LanguageDependencyHandler'
import { Logging, Workspace, WorkspaceFolder } from '@aws/language-server-runtimes/server-interface'
import { CodewhispererLanguage } from '../../../languageDetection'

export class DependencyHandlerFactory {
    static createHandler(
        language: CodewhispererLanguage,
        workspace: Workspace,
        logging: Logging,
        workspaceFolders: WorkspaceFolder[]
    ): LanguageDependencyHandler<BaseDependencyInfo> | null {
        switch (language.toLowerCase()) {
            case 'python':
                return new PythonDependencyHandler(language, workspace, logging, workspaceFolders)
            case 'javascript':
            case 'typescript':
                return new JSTSDependencyHandler(language, workspace, logging, workspaceFolders)
            case 'java':
                return new JavaDependencyHandler(language, workspace, logging, workspaceFolders)
            default:
                return null
        }
    }
}
