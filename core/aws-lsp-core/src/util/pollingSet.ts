// Ported from VSC: https://github.com/aws/aws-toolkit-vscode/blob/b097fbf828b3035514d822f5e995c114ea9799f0/packages/core/src/shared/utilities/pollingSet.ts#L16
/**
 * A useful abstraction that does the following:
 * - keep a set of items.
 * - if the set is non-empty, run some action every interval seconds.
 * - once the set empties, clear the timer
 * @param interval the interval in seconds
 * @param action the action to perform
 */
export class PollingSet<T> extends Set<T> {
    public pollTimer?: NodeJS.Timeout

    public constructor(
        private readonly interval: number,
        private readonly action: () => void
    ) {
        super()
    }

    public isActive(): boolean {
        return this.size !== 0
    }

    public hasTimer(): boolean {
        return this.pollTimer !== undefined
    }

    public clearTimer(): void {
        if (!this.isActive() && this.hasTimer()) {
            clearInterval(this.pollTimer)
            this.pollTimer = undefined
        }
    }

    private poll() {
        this.action()
        if (!this.isActive()) {
            this.clearTimer()
        }
    }

    public override add(id: T) {
        super.add(id)
        this.pollTimer = this.pollTimer ?? setInterval(() => this.poll(), this.interval)
        return this
    }

    public override clear(): void {
        this.clearTimer()
        super.clear()
    }
}
