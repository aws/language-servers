/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProgrammingLanguage } from '@amzn/codewhisperer-streaming'
import { TextDocument } from 'vscode-languageserver-textdocument'

export function extractLanguageNameFromFile(file: TextDocument): ProgrammingLanguage {
    const languageId = file.languageId

    if (languageId === undefined) {
        return { languageName: undefined }
    } else if (
        [
            'bat',
            'yaml',
            'xsl',
            'xml',
            'vue',
            'tex',
            'typescript',
            'swift',
            'stylus',
            'sql',
            'slim',
            'shaderlab',
            'sass',
            'rust',
            'ruby',
            'r',
            'python',
            'pug',
            'powershell',
            'php',
            'perl',
            'markdown',
            'makefile',
            'lua',
            'less',
            'latex',
            'json',
            'javascript',
            'java',
            'ini',
            'html',
            'haml',
            'handlebars',
            'groovy',
            'go',
            'diff',
            'css',
            'c',
            'coffeescript',
            'clojure',
            'bibtex',
            'abap',
        ].includes(languageId)
    ) {
        return { languageName: languageId }
    }

    switch (languageId) {
        case 'cpp':
        case 'cuda-cpp':
            return { languageName: 'c++' }
        case 'csharp':
            return { languageName: 'c#' }
        case 'dockerfile':
            return { languageName: 'dockerfile' }
        case 'fsharp':
            return { languageName: 'f#' }
        case 'git-commit':
        case 'git-rebase':
            return { languageName: 'git' }
        case 'jsonc':
            return { languageName: 'json' }
        case 'objective-c':
            return { languageName: 'objective-c' }
        case 'objective-cpp':
            return { languageName: 'objective-c++' }
        case 'perl6':
            return { languageName: 'raku' }
        case 'jade':
            return { languageName: 'pug' }
        case 'razor':
            return { languageName: 'razor' }
        case 'scss':
            return { languageName: 'sass' }
        case 'shellscript':
            return { languageName: 'sh' }
        case 'vb':
            return { languageName: 'visual-basic' }
        case 'vue-html':
            return { languageName: 'vue' }
        default:
            if (['javascript', 'node'].some(identifier => languageId.includes(identifier))) {
                return { languageName: 'javascript' }
            } else if (languageId.includes('typescript')) {
                // is this actually right? Can we use typescript react
                return { languageName: 'typescript' }
            } else if (languageId.includes('python')) {
                return { languageName: 'python' }
            }

            return { languageName: undefined }
    }
}
