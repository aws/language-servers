import { truncate } from './text'

/**
 * Clones an object (copies "own properties") until `depth`, where:
 * - depth=0 returns non-object value, or empty object (`{}` or `[]`).
 * - depth=1 returns `obj` with its immediate children (but not their children).
 * - depth=2 returns `obj` with its children and their children.
 * - and so on...
 *
 *
 * @param obj Object to clone.
 * @param depth
 * @param omitKeys Omit properties matching these names (at any depth).
 * @param replacement Replacement for object whose fields extend beyond `depth`, and properties matching `omitKeys`.
 * @param maxStringLength truncates string values that exceed this threshold (includes values in nested arrays)
 */
export function partialClone(
    obj: any,
    depth: number = 3,
    omitKeys: string[] = [],
    options?: {
        replacement?: any
        maxStringLength?: number
    }
): any {
    // Base case: If input is not an object or has no children, return it.
    if (typeof obj !== 'object' || obj === null || 0 === Object.getOwnPropertyNames(obj).length) {
        if (typeof obj === 'string' && options?.maxStringLength) {
            return truncate(obj, options?.maxStringLength, '...')
        }
        return obj
    }

    // Create a new object of the same type as the input object.
    const clonedObj = Array.isArray(obj) ? [] : {}

    if (depth === 0) {
        return options?.replacement ? options.replacement : clonedObj
    }

    // Recursively clone properties of the input object
    for (const key in obj) {
        if (omitKeys.includes(key)) {
            // pre-commit hook adds these semi-colons, which then cause lint errors.
            // eslint-disable-next-line no-extra-semi
            ;(clonedObj as any)[key] = options?.replacement ? options.replacement : Array.isArray(obj) ? [] : {}
        } else if (Object.prototype.hasOwnProperty.call(obj, key)) {
            // eslint-disable-next-line no-extra-semi
            ;(clonedObj as any)[key] = partialClone(obj[key], depth - 1, omitKeys, options)
        }
    }

    return clonedObj
}
