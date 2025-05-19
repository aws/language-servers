import * as path from 'path'
import { URI } from 'vscode-uri'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { CancellationToken } from '@aws/language-server-runtimes/server-interface'
import { CancellationError } from './awsError'

type ElementType<T> = T extends (infer U)[] ? U : never
type Dirent = ElementType<Awaited<ReturnType<Features['workspace']['fs']['readdir']>>>

export async function readDirectoryRecursively(
    features: Pick<Features, 'workspace' | 'logging'> & Partial<Features>,
    folderPath: string,
    options?: {
        maxDepth?: number
        excludeDirs?: string[]
        excludeFiles?: string[]
        customFormatCallback?: (entry: Dirent) => string
        failOnError?: boolean
    },
    token?: CancellationToken
): Promise<string[]> {
    const dirExists = await features.workspace.fs.exists(folderPath)
    const excludeFiles = options?.excludeFiles ?? []
    const excludeDirs = options?.excludeDirs ?? []
    if (!dirExists) {
        throw new Error(`Directory does not exist: ${folderPath}`)
    }

    features.logging.info(
        `Reading directory: ${folderPath} to max depth: ${options?.maxDepth === undefined ? 'unlimited' : options.maxDepth}`
    )

    const queue: Array<{ filepath: string; depth: number }> = [{ filepath: folderPath, depth: 0 }]
    const results: string[] = []

    const formatter = options?.customFormatCallback ?? formatListing

    while (queue.length > 0) {
        if (token?.isCancellationRequested) {
            features.logging.info('cancelled readDirectoryRecursively')
            throw new CancellationError('user')
        }

        const { filepath, depth } = queue.shift()!
        if (options?.maxDepth !== undefined && depth > options?.maxDepth) {
            features.logging.info(`Skipping directory: ${filepath} (depth ${depth} > max ${options.maxDepth})`)
            continue
        }

        let entries: Awaited<ReturnType<typeof features.workspace.fs.readdir>>
        try {
            entries = await features.workspace.fs.readdir(filepath)
        } catch (err) {
            if (options?.failOnError) {
                throw err
            }
            const errMsg = `Failed to read: ${filepath} (${err})`
            features.logging.warn(errMsg)
            continue
        }
        for (const entry of entries) {
            const childPath = getEntryPath(entry)
            if (entry.isDirectory()) {
                if (excludeDirs.includes(entry.name)) {
                    features.logging.log(`Skipping directory ${childPath} due to match in [${excludeDirs.join(', ')}]`)
                    continue
                }
            } else {
                if (excludeFiles.includes(entry.name)) {
                    features.logging.log(`Skipping file ${childPath} due to match in [${excludeFiles.join(', ')}]`)
                    continue
                }
            }
            results.push(formatter(entry))
            if (entry.isDirectory() && (options?.maxDepth === undefined || depth < options?.maxDepth)) {
                queue.push({ filepath: childPath, depth: depth + 1 })
            }
        }
    }

    return results
}

/**
 * Returns a prefix for a directory ('[D]'), symlink ('[L]'), or file ('[F]').
 */
export function formatListing(entry: Dirent): string {
    let typeChar: string
    if (entry.isDirectory()) {
        typeChar = '[D]'
    } else if (entry.isSymbolicLink()) {
        typeChar = '[L]'
    } else if (entry.isFile()) {
        typeChar = '[F]'
    } else {
        typeChar = '[?]'
    }
    return `${typeChar} ${path.join(entry.parentPath, entry.name)}`
}

export function getEntryPath(entry: Dirent) {
    return path.join(entry.parentPath, entry.name)
}

export function getWorkspaceFolderPaths(workspace: Features['workspace']): string[] {
    const workspaceFolders = workspace.getAllWorkspaceFolders()
    return workspaceFolders?.map(({ uri }) => URI.parse(uri).fsPath) ?? []
}

export function isParentFolder(parentPath: string, childPath: string): boolean {
    const normalizedParentPath = path.normalize(parentPath)
    const normalizedChildPath = path.normalize(childPath)

    const relative = path.relative(normalizedParentPath, normalizedChildPath)
    return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative)
}

export function isInWorkspace(workspaceFolderPaths: string[], filepath: string) {
    return workspaceFolderPaths.some(wsFolder => isParentFolder(wsFolder, filepath) || wsFolder === filepath)
}

/**
 * Output the result in tree-like format, this will save tokens as the output contains much less characters
 * project-root/
 * |-- src/
 * |   |-- components/
 * |   |   |-- Button.js
 * |   |   |-- Card.js
 * |   |   `-- index.js
 * |   |-- utils/
 * |   |   |-- helpers.js
 * |   |   `-- formatters.js
 * |   `-- index.js
 * |-- public/
 * |   |-- images/
 * |   |   |-- logo.png
 * |   |   `-- banner.jpg
 * |   `-- index.html
 * |-- package.json
 * `-- README.md
 */
export async function readDirectoryWithTreeOutput(
    features: Pick<Features, 'workspace' | 'logging'> & Partial<Features>,
    folderPath: string,
    options?: {
        maxDepth?: number
        excludeDirs?: string[]
        excludeFiles?: string[]
        failOnError?: boolean
    },
    token?: CancellationToken
): Promise<string> {
    const dirExists = await features.workspace.fs.exists(folderPath)
    const excludeFiles = options?.excludeFiles ?? []
    const excludeDirs = options?.excludeDirs ?? []
    if (!dirExists) {
        throw new Error(`Directory does not exist: ${folderPath}`)
    }

    features.logging.info(
        `Reading directory in tree like format: ${folderPath} to max depth: ${options?.maxDepth === undefined ? 'unlimited' : options.maxDepth}`
    )

    // Initialize result with the root directory
    let result = `${folderPath}/\n`

    // Recursive function to build the tree
    const processDirectory = async (dirPath: string, depth: number, prefix: string): Promise<string> => {
        if (token?.isCancellationRequested) {
            features.logging.info('cancelled readDirectoryRecursively')
            throw new CancellationError('user')
        }

        if (options?.maxDepth !== undefined && depth > options?.maxDepth) {
            features.logging.info(`Skipping directory: ${dirPath} (depth ${depth} > max ${options.maxDepth})`)
            return ''
        }

        let entries: Awaited<ReturnType<typeof features.workspace.fs.readdir>>
        try {
            entries = await features.workspace.fs.readdir(dirPath)
        } catch (err) {
            if (options?.failOnError) {
                throw err
            }
            const errMsg = `Failed to read: ${dirPath} (${err})`
            features.logging.warn(errMsg)
            return ''
        }

        // Sort entries: directories first, then files, both alphabetically
        entries.sort((a, b) => {
            const aIsDir = a.isDirectory()
            const bIsDir = b.isDirectory()
            if (aIsDir && !bIsDir) return -1
            if (!aIsDir && bIsDir) return 1
            return a.name.localeCompare(b.name)
        })

        let treeOutput = ''

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i]
            const isLast = i === entries.length - 1

            if (entry.isDirectory()) {
                if (excludeDirs.includes(entry.name)) {
                    features.logging.log(`Skipping directory ${entry.name} due to match in [${excludeDirs.join(', ')}]`)
                    continue
                }
            } else {
                if (excludeFiles.includes(entry.name)) {
                    features.logging.log(`Skipping file ${entry.name} due to match in [${excludeFiles.join(', ')}]`)
                    continue
                }
            }

            // Format this entry with proper tree characters
            const entryType = entry.isDirectory() ? '/' : entry.isSymbolicLink() ? '@' : ''

            // Use '`--' for the last item, '|--' for others
            const connector = isLast ? '`-- ' : '|-- '
            treeOutput += `${prefix}${connector}${entry.name}${entryType}\n`

            // Process subdirectories with proper indentation for the next level
            if (entry.isDirectory() && (options?.maxDepth === undefined || depth < options?.maxDepth)) {
                const childPath = getEntryPath(entry)
                // For the next level, add vertical line for non-last items, spaces for last items
                const childPrefix = prefix + (isLast ? '    ' : '|   ')
                treeOutput += await processDirectory(childPath, depth + 1, childPrefix)
            }
        }

        return treeOutput
    }

    // Start processing from the root directory
    result += await processDirectory(folderPath, 0, '')

    return result
}
