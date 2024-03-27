import { Logging, Workspace, TextDocument } from '@aws/language-server-runtimes/server-interface'
import { CsharpDependencyGraph } from './csharpDependencyGraph'

const languageMap = {
    csharp: CsharpDependencyGraph,
} as const

type LanguageMap = typeof languageMap
type Keys = keyof LanguageMap
type Tuples<T> = T extends Keys ? [T, InstanceType<LanguageMap[T]>] : never
type ClassType<A extends Keys> = Extract<Tuples<Keys>, [A, any]>[1]

export class DependencyGraphFactory {
    static getDependencyGraphFromFileExtensions<K extends Keys>(fileName: string): ClassType<K> {
        return undefined
    }

    static getDependencyGraph<K extends Keys>(
        document: TextDocument,
        workspace: Workspace,
        logging: Logging,
        workspaceFolderPath: string
    ): ClassType<K> {
        switch (document.languageId.toLowerCase()) {
            case 'csharp':
                return new languageMap['csharp'](workspace, logging, workspaceFolderPath)
            default:
                return this.getDependencyGraphFromFileExtensions(document.uri)
        }
    }
}
