// TODO: move to this general utility?
import { Features } from '../types'
import { ChatResult } from '@aws/language-server-runtimes/protocol'

// Build an abstraction that allows for "message boundaries" without actually having them.
export class ResponseStream {
    #sendProgress: (chunk: ChatResult | string) => Promise<void>
    #chatResults: ChatResult[]
    #logging: Features['logging']
    #locked: boolean = false

    constructor(logging: Features['logging'], sendProgress: (chunk: ChatResult | string) => Promise<void>) {
        this.#sendProgress = sendProgress
        this.#chatResults = []
        this.#logging = logging
    }

    get length(): number {
        return this.#chatResults.length
    }

    nextResult(chunk: ChatResult): ChatResult {
        return { ...chunk, body: this.#chatResults.map(chunk => chunk.body).join('\n\n') }
    }

    async writeResult(chunk: ChatResult) {
        this.#chatResults.push(chunk)
        await this.#sendProgress(this.nextResult(chunk))
    }
    // TODO: clean this up.
    getStreamWriter() {
        this.#locked = true
        const pendingResults: Promise<void>[] = []
        let finalChunk: ChatResult | undefined = undefined
        return {
            write: async (chunk: ChatResult) => {
                // TODO: error if another writer has this locked.
                const r = this.#sendProgress({
                    ...chunk,
                    body: [...this.#chatResults, chunk].map(chunk => chunk.body).join('\n\n'),
                })
                pendingResults.push(r)
                finalChunk = chunk
                return r
            },
            close: async () => {
                if (finalChunk) {
                    this.#chatResults.push(finalChunk)
                }
                await Promise.all(pendingResults)
                this.#locked = false
            },
        }
    }
}
