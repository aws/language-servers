// In order for this to work in non-NodeJS environments, servers must be built with bundler including `path-browserify` and `os-browserify` modules.
import * as os from 'os'
import * as path from 'path'

// Partial port of implementation in AWS Toolkit for VSCode
// https://github.com/aws/aws-toolkit-vscode/blob/9d8ddbd85f4533e539a58e76f7c46883d8e50a79/packages/core/src/shared/utilities/pathUtils.ts

/** Matches Windows drive letter ("C:"). */
export const driveLetterRegex = /^[a-zA-Z]\:/

/**
 * Returns `true` if path `p` is a descendant of directory `d` (or if they are
 * identical).
 *
 * Only the logical structure is checked; the paths are not checked for
 * existence on the filesystem.
 *
 * @param d  Path to a directory.
 * @param p  Path to file or directory to test.
 */
export function isInDirectory(d: string, p: string): boolean {
    if (d === '' || p === '') {
        return true
    }
    const parentDirPieces = normalizeSeparator(d).split('/')
    const containedPathPieces = normalizeSeparator(p).split('/')

    if (parentDirPieces.length > containedPathPieces.length) {
        return false
    }

    // Remove final empty element(s), if `d` ends with slash(es).
    while (parentDirPieces.length > 0 && parentDirPieces[parentDirPieces.length - 1] === '') {
        parentDirPieces.pop()
    }
    const caseInsensitive = os.platform() === 'win32'

    return parentDirPieces.every((value, index) => {
        return caseInsensitive
            ? value.toLowerCase() === containedPathPieces[index].toLowerCase()
            : value === containedPathPieces[index]
    })
}

/**
 * - Replaces backslashes "\\" with "/"
 * - Removes redundant path separators (except initial double-slash for UNC-style paths).
 */
export function normalizeSeparator(p: string) {
    const normalized = p.replace(/[\/\\]+/g, '/')
    if (isUncPath(p)) {
        return '/' + normalized
    }
    return normalized
}

export function isUncPath(path: string) {
    return /^\s*[\/\\]{2}[^\/\\]+/.test(path)
}

/**
 * Normalizes path `p`:
 * - Replaces backslashes "\\" with "/".
 * - Removes redundant path separators (except initial double-slash for UNC-style paths).
 * - Uppercases drive-letter (Windows).
 * - ...and returns the result of `path.normalize()`.
 */
export function normalize(p: string): string {
    if (!p || p.length === 0) {
        return p
    }
    const firstChar = p.substring(0, 1)
    if (driveLetterRegex.test(p.substring(0, 2))) {
        return normalizeSeparator(path.normalize(firstChar.toUpperCase() + p.substring(1)))
    }
    if (isUncPath(p)) {
        return normalizeSeparator(p)
    }
    return normalizeSeparator(path.normalize(p))
}

export function sanitize(inputPath: string): string {
    let sanitized = inputPath.trim()

    if (sanitized.startsWith('~')) {
        sanitized = path.join(os.homedir(), sanitized.slice(1))
    }

    if (!path.isAbsolute(sanitized)) {
        sanitized = path.resolve(sanitized)
    }
    return sanitized
}

export function getUserHomeDir(): string {
    return os.homedir()
}
