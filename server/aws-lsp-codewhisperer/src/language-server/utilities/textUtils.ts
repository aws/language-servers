export function undefinedIfEmpty(str: string | undefined): string | undefined {
    if (str && str.trim().length > 0) {
        return str
    }

    return undefined
}
