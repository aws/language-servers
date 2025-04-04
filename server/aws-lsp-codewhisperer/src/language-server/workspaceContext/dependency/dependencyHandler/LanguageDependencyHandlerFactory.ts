import { JavaDependencyHandler } from './JavaDependencyHandler'
import { PythonDependencyHandler } from './PythonDependencyHandler'
import { JSTSDependencyHandler } from './JSTSDependencyHandler'
import { BaseDependencyInfo, LanguageDependencyHandler } from './LanguageDependencyHandler'
import { Logging, Workspace, WorkspaceFolder } from '@aws/language-server-runtimes/server-interface'
import { CodewhispererLanguage } from '../../../languageDetection'
import { ArtifactManager } from '../../artifactManager'

export class DependencyHandlerFactory {
    static createHandler(
        language: CodewhispererLanguage,
        workspace: Workspace,
        logging: Logging,
        workspaceFolders: WorkspaceFolder[],
        artifactManager: ArtifactManager
    ): LanguageDependencyHandler<BaseDependencyInfo> | null {
        switch (language.toLowerCase()) {
            case 'python':
                return new PythonDependencyHandler(
                    language,
                    workspace,
                    logging,
                    workspaceFolders,
                    artifactManager,
                    'site-packages'
                )
            case 'javascript':
            case 'typescript':
                return new JSTSDependencyHandler(
                    language,
                    workspace,
                    logging,
                    workspaceFolders,
                    artifactManager,
                    'node_modules'
                )
            case 'java':
                return new JavaDependencyHandler(
                    language,
                    workspace,
                    logging,
                    workspaceFolders,
                    artifactManager,
                    'dependencies'
                )
            default:
                return null
        }
    }
}
