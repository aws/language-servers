import { distance } from 'fastest-levenshtein'
import { Position } from '@aws/language-server-runtimes/server-interface'
import { Features } from '../types'
import { getErrorMessage, getUnmodifiedAcceptedTokens } from '../../shared/utils'

export interface AcceptedSuggestionEntry {
    fileUrl: string
    time: number
    originalString: string
    startPosition: Position
    endPosition: Position
    customizationArn?: string
}

export interface CodeDiffTrackerOptions {
    flushInterval?: number
    timeElapsedThreshold?: number
    maxQueueSize?: number
}

/**
 * This class calculates the percentage of user modification after a time threshold and emits metric
 * The current calculation method is (Levenshtein edit distance / acceptedSuggestion.length).
 */
export class CodeDiffTracker<T extends AcceptedSuggestionEntry = AcceptedSuggestionEntry> {
    /**
     * time indication the flush frequency of which the checks are
     */
    private static readonly FLUSH_INTERVAL = 1000 * 60 // 1 minute
    /**
     * time threshold before measuring the modification after accepted into the editor
     */
    private static readonly TIME_ELAPSED_THRESHOLD = 1000 * 60 * 5 // 5 minutes
    private static readonly DEFAULT_MAX_QUEUE_SIZE = 10000

    #eventQueue: T[]
    #interval?: NodeJS.Timeout
    #workspace: Features['workspace']
    #logging: Features['logging']
    #recordMetric: (
        entry: T,
        codeModificationPercentage: number,
        unmodifiedAcceptedCharacterCount: number
    ) => Promise<void>
    #flushInterval: number
    #timeElapsedThreshold: number
    #maxQueueSize: number

    /**
     * This function calculates the Levenshtein edit distance of currString from original accepted String
     * then return a percentage against the length of accepted string (capped by 1)
     * @param currString the current string in the same location as the previously accepted suggestion
     * @param acceptedString the accepted suggestion that was inserted into the editor
     */
    public static checkDiff(currString?: string, acceptedString?: string): number {
        if (!currString || !acceptedString) {
            return 1
        }

        const diff = distance(currString, acceptedString)
        return Math.min(1, diff / acceptedString.length)
    }

    constructor(
        workspace: Features['workspace'],
        logging: Features['logging'],
        recordMetric: (
            entry: T,
            codeModificationPercentage: number,
            unmodifiedAcceptedCharacterCount: number
        ) => Promise<void>,
        options?: CodeDiffTrackerOptions
    ) {
        this.#eventQueue = []
        this.#workspace = workspace
        this.#logging = logging
        this.#recordMetric = recordMetric
        this.#flushInterval = options?.flushInterval ?? CodeDiffTracker.FLUSH_INTERVAL
        this.#timeElapsedThreshold = options?.timeElapsedThreshold ?? CodeDiffTracker.TIME_ELAPSED_THRESHOLD
        this.#maxQueueSize = options?.maxQueueSize ?? CodeDiffTracker.DEFAULT_MAX_QUEUE_SIZE
    }

    public enqueue(suggestion: T) {
        this.#eventQueue.push(suggestion)

        // remove the oldest entries if the queue if full
        while (this.#eventQueue.length > this.#maxQueueSize) {
            this.#eventQueue.shift()
        }

        // ensure there is an active interval
        this.#startInterval()
    }

    public async shutdown() {
        this.#clearInterval()

        try {
            await this.flush()
        } catch (e) {
            this.#logging.log(`Error encountered while performing the final flush: ${e}`)
        }
    }

    // Used for accessing the codeDiffTracker eventQueue in unit tests
    public get eventQueue() {
        return this.#eventQueue
    }

    private async flush() {
        const newEventQueue: T[] = []

        // emit the ones that reach the time limit and start a new queue with remaining
        for (const suggestion of this.#eventQueue) {
            if (Date.now() - suggestion.time >= this.#timeElapsedThreshold) {
                await this.#emitTelemetryOnSuggestion(suggestion as T)
            } else {
                newEventQueue.push(suggestion as T)
            }
        }

        this.#eventQueue = newEventQueue

        // shutdown the interval when queue is empty
        if (this.#eventQueue.length === 0) {
            this.#clearInterval()
        }
    }

    async #emitTelemetryOnSuggestion(suggestion: T) {
        try {
            const document = suggestion.fileUrl && (await this.#workspace.getTextDocument(suggestion.fileUrl))

            if (document) {
                const currString = document.getText({
                    start: suggestion.startPosition,
                    end: suggestion.endPosition,
                })
                const percentage = CodeDiffTracker.checkDiff(currString, suggestion.originalString)
                const unmodifiedAcceptedCharacterCount = getUnmodifiedAcceptedTokens(
                    suggestion.originalString,
                    currString
                )
                await this.#recordMetric(suggestion, percentage, unmodifiedAcceptedCharacterCount)
            }
        } catch (e) {
            this.#logging.log(`Exception Thrown from CodeDiffTracker: ${e}`)
        }
    }

    #startInterval() {
        if (!this.#interval) {
            const recursiveSetTimeout = () => {
                this.#interval = setTimeout(async () => {
                    try {
                        await this.flush()
                    } catch (e) {
                        this.#logging.log(`flush failed: ${getErrorMessage(e)}`)
                    } finally {
                        recursiveSetTimeout()
                    }
                }, this.#flushInterval)
            }
            recursiveSetTimeout()
        }
    }

    #clearInterval() {
        clearTimeout(this.#interval)
        this.#interval = undefined
    }
}
