// Todo: duplicate function. remove it when other PRs are merged
export function sleep(duration = 0): Promise<void> {
    return new Promise(r => setTimeout(r, Math.max(duration, 0)))
}
