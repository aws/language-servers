import { partialClone } from './collectionUtils'

export function formatObj(
    o: any,
    options?: {
        depth?: number
        maxStringLength?: number
        omitKeys?: string[]
        replacement?: string
    }
): string {
    const defaultMaxStringLength = 50
    const defaultMaxDepth = 3
    return JSON.stringify(
        partialClone(o, options?.depth ?? defaultMaxDepth, options?.omitKeys ?? [], {
            maxStringLength: options?.maxStringLength ?? defaultMaxStringLength,
            replacement: options?.replacement ?? '[omitted]',
        }),
        null,
        2
    )
}
