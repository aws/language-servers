export type AsyncEventHandler<TEventArg> = (sender: object, e: TEventArg) => Promise<void>

export class AsyncEvent<TEventArg> {
    private handlers = new Set<AsyncEventHandler<TEventArg>>()

    add(handler: AsyncEventHandler<TEventArg>) {
        this.handlers.add(handler)
    }

    remove(handler: AsyncEventHandler<TEventArg>) {
        this.handlers.delete(handler)
    }

    async raise(sender: object, e: TEventArg) {
        for (const handler of this.handlers) {
            await handler(sender, e)
        }
    }
}
