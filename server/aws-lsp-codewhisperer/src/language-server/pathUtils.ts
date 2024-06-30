import os = require('os')

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
