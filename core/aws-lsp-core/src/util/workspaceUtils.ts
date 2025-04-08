import * as path from 'path'
import { Features } from '@aws/language-server-runtimes/server-interface/server'

type ElementType<T> = T extends (infer U)[] ? U : never
type Dirent = ElementType<Awaited<ReturnType<Features['workspace']['fs']['readdir']>>>

// Port of https://github.com/aws/aws-toolkit-vscode/blob/dfee9f7a400e677e91a75e9c20d9515a52a6fad4/packages/core/src/shared/utilities/workspaceUtils.ts#L699
export async function readDirectoryRecursively(
    features: Features,
    folderPath: string,
    maxDepth?: number,
    customFormatCallback?: (entry: Dirent) => string
): Promise<string[]> {
    features.logging.info(
        `Reading directory: ${folderPath} to max depth: ${maxDepth === undefined ? 'unlimited' : maxDepth}`
    )

    const queue: Array<{ filepath: string; depth: number }> = [{ filepath: folderPath, depth: 0 }]
    const results: string[] = []

    const formatter = customFormatCallback ?? formatListing

    while (queue.length > 0) {
        const { filepath, depth } = queue.shift()!
        if (maxDepth !== undefined && depth > maxDepth) {
            features.logging.info(`Skipping directory: ${filepath} (depth ${depth} > max ${maxDepth})`)
            continue
        }

        let entries: Awaited<ReturnType<typeof features.workspace.fs.readdir>>
        try {
            entries = await features.workspace.fs.readdir(filepath)
        } catch (err) {
            features.logging.error(`Cannot read directory: ${filepath} (${err})`)
            results.push(`Cannot read directory: ${filepath} (${err})`)
            continue
        }

        for (const entry of entries) {
            results.push(formatter(entry))
            // Depending on Node version fs.Dirent.path refers to the parentPath or the full path. https://github.com/nodejs/node/issues/51955#issuecomment-1977131319
            // TODO: fix this by updating Dirent interface in runtimes.
            const childPath = entry.path.endsWith(entry.name) ? entry.path : path.join(entry.path, entry.name)

            if (entry.isDirectory() && (maxDepth === undefined || depth < maxDepth)) {
                queue.push({ filepath: childPath, depth: depth + 1 })
            }
        }
    }

    return results
}

// TODO: add a way to check symlinks in runtimes rather than doing it implicitly.
/**
 * Returns a prefix for a directory ('[DIR]'), symlink ('[LINK]'), or file ('[FILE]').
 */
export function formatListing(entry: Dirent): string {
    let typeChar = '[LINK]'
    if (entry.isDirectory()) {
        typeChar = '[DIR]'
    } else if (entry.isFile()) {
        typeChar = '[FILE]'
    }
    return `${typeChar} ${path.join(entry.path, entry.name)}`
}
