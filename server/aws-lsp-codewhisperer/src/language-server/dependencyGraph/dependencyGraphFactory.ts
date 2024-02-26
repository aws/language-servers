import { Workspace } from '@aws/language-server-runtimes/out/features'
import { TextDocument } from 'vscode-languageserver-textdocument'
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

    static getDependencyGraph<K extends Keys>(document: TextDocument, workspace: Required<Workspace>): ClassType<K> {
        switch (document.languageId.toLowerCase()) {
            case 'csharp':
                return new languageMap['csharp'](workspace)
            default:
                return this.getDependencyGraphFromFileExtensions(document.uri)
        }
    }
}
