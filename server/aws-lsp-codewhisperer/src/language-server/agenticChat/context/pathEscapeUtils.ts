/**
 * Utility functions for consistent path escaping in file descriptions.
 *
 * When paths are serialized to JSON, backslashes get escaped. To ensure consistent
 * multi-escaped appearance in the final JSON output, we need to ensure all paths
 * are properly double-escaped before being used in description fields.
 */

/**
 * Ensures a Windows path is properly double-escaped for consistent JSON serialization.
 *
 * This function normalizes path escaping to ensure that when the path is later
 * JSON.stringify'd, it will have the correct multi-escaped appearance.
 *
 * @param filePath - The file path that may be single or double escaped, or undefined
 * @returns A consistently double-escaped path, or undefined if input was undefined
 *
 * @example
 * // Single-escaped input
 * ensureDoubleEscapedPath("c:\\Users\\file.txt")
 * // Returns: "c:\\\\Users\\\\file.txt"
 *
 * // Already double-escaped input (no change)
 * ensureDoubleEscapedPath("c:\\\\Users\\\\file.txt")
 * // Returns: "c:\\\\Users\\\\file.txt"
 *
 * // Unix paths (no change)
 * ensureDoubleEscapedPath("/home/user/file.txt")
 * // Returns: "/home/user/file.txt"
 *
 * // Undefined input
 * ensureDoubleEscapedPath(undefined)
 * // Returns: undefined
 */
export function ensureDoubleEscapedPath(filePath: string | undefined): string | undefined {
    if (!filePath) {
        return filePath
    }

    // Only process Windows-style paths (containing backslashes)
    if (!filePath.includes('\\')) {
        return filePath
    }

    // Check if the path is already double-escaped by looking for consecutive backslashes
    // If we find \\\\, it's likely already double-escaped
    if (filePath.includes('\\\\')) {
        return filePath
    }

    // Single-escaped path - convert to double-escaped
    // Replace single backslashes with double backslashes
    return filePath.replace(/\\/g, '\\\\')
}

/**
 * Ensures consistent path escaping for file descriptions across the application.
 * This is the main function that should be used whenever setting a file path
 * in a description field that will be JSON serialized.
 *
 * @param filePath - The file path to normalize, or undefined
 * @returns A path that will display consistently when JSON serialized, or undefined if input was undefined
 */
export function normalizePathForDescription(filePath: string | undefined): string | undefined {
    return ensureDoubleEscapedPath(filePath)
}
