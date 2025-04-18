import * as path from 'path'
import { URI } from 'vscode-uri'
import { Features } from '@aws/language-server-runtimes/server-interface/server'

type ElementType<T> = T extends (infer U)[] ? U : never
type Dirent = ElementType<Awaited<ReturnType<Features['workspace']['fs']['readdir']>>>

// Port of https://github.com/aws/aws-toolkit-vscode/blob/dfee9f7a400e677e91a75e9c20d9515a52a6fad4/packages/core/src/shared/utilities/workspaceUtils.ts#L699
export async function readDirectoryRecursively(
    features: Pick<Features, 'workspace' | 'logging'> & Partial<Features>,
    folderPath: string,
    options?: {
        maxDepth?: number
        excludePatterns?: (string | RegExp)[]
        customFormatCallback?: (entry: Dirent) => string
        failOnError?: boolean
    }
): Promise<string[]> {
    const dirExists = await features.workspace.fs.exists(folderPath)
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
            if (options?.excludePatterns?.some(pattern => new RegExp(pattern).test(childPath))) {
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
export async function inWorkspace(workspace: Features['workspace'], filepath: string) {
    return (await workspace.getTextDocument(URI.file(filepath).toString())) !== undefined
}
