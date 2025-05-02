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
        excludeEntries?: string[]
        customFormatCallback?: (entry: Dirent) => string
        failOnError?: boolean
    },
    token?: CancellationToken
): Promise<string[]> {
    const dirExists = await features.workspace.fs.exists(folderPath)
    const excludeEntries = options?.excludeEntries ?? []
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
            if (excludeEntries.includes(entry.name)) {
                features.logging.log(`Skipping path ${childPath} due to match in [${excludeEntries.join(', ')}]`)
                continue
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

// TODO: port this to runtimes?
export function getWorkspaceFolderPaths(lsp: Features['lsp']): string[] {
    return lsp.getClientInitializeParams()?.workspaceFolders?.map(({ uri }) => URI.parse(uri).fsPath) ?? []
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
