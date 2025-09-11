import { JavaDependencyHandler } from './JavaDependencyHandler'
import { PythonDependencyHandler } from './PythonDependencyHandler'
import { JSTSDependencyHandler } from './JSTSDependencyHandler'
import {
    BaseDependencyInfo,
    DependencyHandlerSharedState,
    LanguageDependencyHandler,
} from './LanguageDependencyHandler'
import { Logging, Workspace, WorkspaceFolder } from '@aws/language-server-runtimes/server-interface'
import { ArtifactManager } from '../../artifactManager'
import { CodewhispererLanguage } from '../../../../shared/languageDetection'

export class DependencyHandlerFactory {
    static createHandler(
        language: CodewhispererLanguage,
        workspace: Workspace,
        logging: Logging,
        workspaceFolders: WorkspaceFolder[],
        artifactManager: ArtifactManager,
        dependencyHandlerSharedState: DependencyHandlerSharedState
    ): LanguageDependencyHandler<BaseDependencyInfo> | null {
        switch (language.toLowerCase()) {
            case 'python':
                return new PythonDependencyHandler(
                    language,
                    workspace,
                    logging,
                    workspaceFolders,
                    artifactManager,
                    'site-packages',
                    dependencyHandlerSharedState
                )
            case 'javascript':
            case 'typescript':
                return new JSTSDependencyHandler(
                    language,
                    workspace,
                    logging,
                    workspaceFolders,
                    artifactManager,
                    'node_modules',
                    dependencyHandlerSharedState
                )
            case 'java':
                return new JavaDependencyHandler(
                    language,
                    workspace,
                    logging,
                    workspaceFolders,
                    artifactManager,
                    'dependencies',
                    dependencyHandlerSharedState
                )
            default:
                return null
        }
    }
}
