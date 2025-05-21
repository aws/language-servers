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
                        const overlap = exportedSymbols.length // TODO: intersection of imported & exported
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

    extractImportedPaths(testFilePath: string, config: Metadata, projectRoot: string): string[] {
        const content = fs.readFileSync(testFilePath)
        const lines = content.toString().split(os.EOL)
        // TODO: original science source code use set
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
        // TODO: original science source code use set
        const result: string[] = []
        try {
            const content = fs.readFileSync(candidateAbsPath)
            const lines = content.toString().split(os.EOL)
            let buffer = ''
            let insideImportBlock = false

            for (const l of lines) {
                const line = l.trim()
                if (line.startsWith('import') || insideImportBlock) {
                    buffer += ' ' + line
                    insideImportBlock = true

                    // end of import block
                    if (line.includes('from') || line.includes(';')) {
                        const namedMatch = buffer.match(/{([^}]+)}/g)
                        if (namedMatch) {
                            for (const m of namedMatch) {
                                const innerContent = m.slice(1, -1)
                                const parts = innerContent
                                    .split(',')
                                    .map(s => s.trim())
                                    .filter(s => s.length > 0)

                                for (const p of parts) {
                                    result.push(p)
                                }
                            }
                        }

                        const defaultMatch = buffer.match(/import\s+([a-zA-Z_$][\w$]*)\s*(,|\s+from)/)
                        if (defaultMatch) {
                            result.push(defaultMatch[1])
                        }

                        buffer = ''
                        insideImportBlock = false
                    }
                }
            }
        } catch (e) {
            console.log(`error reading import symbols: ${e}`)
        }
        return result
    }

    extractExportedSymbolsFromFile(candidateAbsPath: string): string[] {
        const result: string[] = []
        try {
            const content = fs.readFileSync(candidateAbsPath)
            const lines = content.toString().split(os.EOL)
            for (const l of lines) {
                const line = l.trim()

                const matchFunc = /export\s+function\s+([a-zA-Z_$][\w$]*)/.exec(line)
                if (matchFunc) {
                    result.push(matchFunc[1])
                }

                const matchClass = /export\s+class\s+([a-zA-Z_$][\w$]*)/.exec(line)
                if (matchClass) {
                    result.push(matchClass[1])
                }

                const matchConst = /export\s+const\s+([a-zA-Z_$][\w$]*)/.exec(line)
                if (matchConst) {
                    result.push(matchConst[1])
                }

                const matchNamedBlock = /export\s+{([^}]+)}/g.exec(line) || []
                for (const m of matchNamedBlock) {
                    const parts = m
                        .split(',')
                        .map(s => s.trim())
                        .filter(s => s.length > 0)

                    result.push(...parts)
                }

                const matchDefault = /export\s+default\s+([a-zA-Z_$][\w$]*)/.exec(line)
                if (matchDefault) {
                    result.push(matchDefault[1])
                }

                const matchDefaultFunc = /export\s+default\s+function\s+([a-zA-Z_$][\w$]*)/.exec(line)
                if (matchDefaultFunc) {
                    result.push(matchDefaultFunc[1])
                }
            }
        } catch (e) {
            console.log(`error reading exported symbols: ${e}`)
        }

        return result
    }

    resolveImportToAbsPath(
        testFilePath: string,
        importPath: string,
        projectRoot: string,
        config: Metadata
    ): string | undefined {
        // Handle module aliases
        const moduleAlias = config.moduleAliases
        if (moduleAlias) {
            for (const [alias, relPath] of Object.entries(moduleAlias)) {
                if (importPath.startsWith(alias)) {
                    const rest = importPath.substring(alias.length)
                    const resolved = relPath + rest
                    return resolved
                }
            }
        }

        // Handle relative or absolute paths
        if (importPath.startsWith('.') || importPath.startsWith('/')) {
            const testDir = path.dirname(testFilePath)
            const absPath = path.normalize(path.join(testDir, importPath))
            return absPath
        }

        // Try fallback roots
        const fallbackRoots = ['src', 'lib']
        for (const base of fallbackRoots) {
            const candidate = path.normalize(path.join(projectRoot, base, importPath))
            if (fs.existsSync(candidate) || fs.existsSync(candidate + '.ts') || fs.existsSync(candidate + '.js')) {
                return candidate
            }
        }

        return undefined
    }

    // TODO: implementation: return all files under project root
    walk(projectRoot: string): string[] {
        return []
    }
}
