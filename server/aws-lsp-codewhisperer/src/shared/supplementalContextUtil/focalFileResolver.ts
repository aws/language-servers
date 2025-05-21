/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'

import { pathUtils } from '@aws/lsp-core'

type Metadata = {
    lang: string
    extensions: string[]
    testAffixes: string[]
    packageMarker?: RegExp
    importPatterns?: RegExp[]
    packageSeparator: string
    moduleAliases?: Record<string, string>
}

const LANGUAGE_CONFIG: Record<string, Metadata> = {
    java: {
        lang: 'java',
        extensions: ['.java'],
        testAffixes: ['Test', 'Tests'],
        packageMarker: /^package\s+([a-zA-Z0-9_.]+);/,
        packageSeparator: '.',
    },
    python: {
        lang: 'python',
        extensions: ['.py'],
        testAffixes: ['test_', '_test'],
        importPatterns: [/^import\s+([a-zA-Z0-9_.]+)/, /^from\s+([a-zA-Z0-9_.]+)/],
        packageSeparator: '.',
    },
    javascript: {
        lang: 'javascript',
        extensions: ['.js'],
        testAffixes: ['.test', '.spec'],
        importPatterns: [/^import.*from\s+[\'"](.+)[\'"]/],
        packageSeparator: '/',
    },
    typescript: {
        lang: 'typescript',
        extensions: ['.ts'],
        testAffixes: ['.test', '.spec'],
        importPatterns: [/^import.*from\s+[\'"](.+)[\'"]/],
        packageSeparator: '/',
        moduleAliases: {
            '@src': 'src',
        },
    },
}

class FocalFileResolver {
    constructor() {}

    inferSourceFile(testFilePath: string, projectRoot: string, language: string): string | undefined {
        const inferredSrcFilename = this.inferFocalFilename(testFilePath, language)

        if (!inferredSrcFilename) {
            console.log(`not able to infer source file name`)
            return
        }

        const config = LANGUAGE_CONFIG[language]

        // find candidate focal files based on naming conventions
        const candidates: { fullPath: string; relativePath: string }[] = []
        const files = this.walk(projectRoot)

        for (const file of files) {
            const ext = path.extname(file)
            const base = path.basename(file, ext)

            if (base === inferredSrcFilename) {
                // TODO: not correct, fix fullPath & relativePath once walk is implemented
                candidates.push({
                    fullPath: file,
                    relativePath: file,
                })
            }
        }

        if (candidates.length === 0) {
            return undefined
        }

        if (candidates.length === 1) {
            return candidates[0].fullPath
        }

        // filter based on the imported path and symbols
        const importedFiles = this.extractImportedPaths(testFilePath, config, projectRoot)
        const filteredCandidate = []
        for (const candidate of candidates) {
            for (const importedFileAbsPath of importedFiles) {
                const ext = path.extname(importedFileAbsPath)
                // os.path.splittext(importedFileAbsPath)[0]
                const p = importedFileAbsPath.substring(0, importedFileAbsPath.length - ext.length)
                if (candidate.fullPath.startsWith(importedFileAbsPath) || candidate.fullPath.includes(p)) {
                    filteredCandidate.push(candidate)
                    break
                }
            }
        }

        if (filteredCandidate.length) {
            switch (language) {
                case 'javascript':
                case 'typescript':
                    const importedSymbols = this.extractImportedSymbols(testFilePath)
                    let bestMatch = undefined
                    let bestOverlap = 0

                    for (const candidate of filteredCandidate) {
                        const exportedSymbols = this.extractExportedSymbolsFromFile(candidate.fullPath)
                        const overlap = exportedSymbols.length // intersection of imported & exported
                        if (overlap > bestOverlap) {
                            bestOverlap = overlap
                            bestMatch = candidate
                        }
                    }

                    if (bestMatch) {
                        return bestMatch.fullPath
                    }
                    return undefined

                default:
                    return filteredCandidate[0].fullPath
            }
        }

        return undefined
    }

    inferFocalFilename(testFilePath: string, language: string): string | undefined {
        const config = LANGUAGE_CONFIG[language]
        const filename = path.basename(testFilePath)
        const ext = path.extname(testFilePath)

        let inferredSrcFilename: string | undefined
        for (const affix of config['testAffixes']) {
            if (filename.endsWith(affix)) {
                inferredSrcFilename = filename.substring(0, filename.length - affix.length) + ext
                break
            } else if (filename.endsWith(affix)) {
                inferredSrcFilename = filename.substring(affix.length) + ext
                break
            }
        }

        return inferredSrcFilename
    }

    // TODO: implementation
    extractImportedPaths(testFilePath: string, config: Metadata, projectRoot: string): string[] {
        const content = fs.readFileSync(testFilePath)
        const lines = content.toString().split(os.EOL)
        const result: string[] = []
        let buffer = ''
        let insideImportBlock = false
        try {
            for (const l of lines) {
                const line = l.trim()

                if (config.lang === 'java') {
                    const match = config.packageMarker?.exec(line)
                    if (match) {
                        // TODO: 0 or 1 ?
                        const pkg = match[1].replace(new RegExp(config.packageSeparator, 'g'), path.sep)
                        result.push(pkg)
                        continue
                    }
                }

                if (config.lang === 'python' && config.importPatterns) {
                    for (const pattern of config.importPatterns) {
                        const match = pattern.exec(line)
                        if (match) {
                            const imp = match[1].replace(new RegExp(config.packageSeparator, 'g'), path.sep)
                            result.push(imp)
                            continue
                        }
                    }
                }

                if (line.startsWith('import') || insideImportBlock) {
                    buffer += ' ' + line
                    insideImportBlock = true

                    if ((line.includes(';') || line.includes('from')) && config.importPatterns) {
                        for (const pattern of config.importPatterns) {
                            const match = pattern.exec(buffer.trim())
                            if (match) {
                                const imp = match[1]
                                const absPath = this.resolveImportToAbsPath(testFilePath, imp, projectRoot, config)
                                if (absPath) {
                                    result.push(absPath)
                                }
                            }
                        }
                        buffer = ''
                        insideImportBlock = false
                    }
                }
            }
        } catch (e) {
            console.log(`error reading import paths: ${e}`)
        }

        return result
    }

    // TODO: implementation
    extractImportedSymbols(candidateAbsPath: string): string[] {
        return []
    }

    // TODO: implementation
    extractExportedSymbolsFromFile(candidateAbsPath: string): string[] {
        return []
    }

    resolveImportToAbsPath(
        testFilePath: string,
        importPath: string,
        projectRoot: string,
        config: Metadata
    ): string | undefined {
        return ''
    }

    // TODO: implementation: return all files under project root
    walk(projectRoot: string): string[] {
        return []
    }
}
