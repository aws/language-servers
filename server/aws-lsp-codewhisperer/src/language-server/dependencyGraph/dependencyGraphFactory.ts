/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { Workspace } from '@aws-placeholder/aws-language-server-runtimes/out/features'
import { TextDocument } from 'vscode-languageserver-textdocument'
import * as CodeWhispererConstants from './constants'
import { CsharpDependencyGraph } from './csharpDependencyGraph'
import { JavascriptDependencyGraph } from './javascriptDependencyGraph'

const languageMap = {
    javascript: JavascriptDependencyGraph,
    typescript: JavascriptDependencyGraph, // typescript use same javascript dependency graph
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
        switch (document.languageId) {
            case 'javascript' satisfies CodeWhispererConstants.PlatformLanguageId:
                return new languageMap['javascript'](
                    'javascript' satisfies CodeWhispererConstants.PlatformLanguageId,
                    workspace
                )
            case 'typescript' satisfies CodeWhispererConstants.PlatformLanguageId:
                return new languageMap['typescript'](
                    'typescript' satisfies CodeWhispererConstants.PlatformLanguageId,
                    workspace
                )
            case 'csharp' satisfies CodeWhispererConstants.PlatformLanguageId:
                return new languageMap['csharp'](
                    'csharp' satisfies CodeWhispererConstants.PlatformLanguageId,
                    workspace
                )
            default:
                return this.getDependencyGraphFromFileExtensions(document.uri)
        }
    }
}
