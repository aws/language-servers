import * as fs from 'fs'

/**
 * Path validation utilities (synchronous only)
 */

/**
 * Validates that a path is not empty or undefined
 * @param path Path to validate
 * @throws Error if path is empty or undefined
 */
export function validatePathBasic(path: string): void {
    if (!path || path.trim().length === 0) {
        throw new Error('Path cannot be empty.')
    }
}

/**
 * Synchronously validates that a path exists
 * @param path Path to validate
 * @throws Error if path does not exist
 */
export function validatePathExists(path: string): void {
    validatePathBasic(path)
    if (!fs.existsSync(path)) {
        throw new Error(`Path "${path}" does not exist or cannot be accessed.`)
    }
}

/**
 * Validates that an array of paths is not empty and all paths exist
 * @param paths Array of paths to validate
 * @throws Error if paths array is empty or if any path is invalid
 */
export function validatePaths(paths: string[] | undefined): void {
    if (!paths || paths.length === 0) {
        throw new Error('Paths array cannot be empty.')
    }

    for (const path of paths) {
        validatePathExists(path)
    }
}
