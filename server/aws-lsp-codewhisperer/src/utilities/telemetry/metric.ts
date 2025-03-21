import deepmerge = require('deepmerge')

type Data = string | number | boolean | { [x: string]: Data } | Data[] | undefined | null

export class Metric<T extends { [key: string]: Data }> {
    #metric: Partial<T>
    #startTime?: number

    constructor(metric?: Partial<T>) {
        this.#metric = metric ?? {}
    }

    get metric() {
        return this.#metric
    }

    public recordStart() {
        this.#startTime = Date.now()
    }

    public getTimeElapsed() {
        return Date.now() - this.#startTime!
    }

    public mergeWith(otherMetric: Partial<T>, options?: deepmerge.Options): Metric<T> {
        this.#metric = deepmerge(this.#metric, otherMetric, options)

        return this
    }

    public setDimension<TDimension extends keyof T>(
        name: TDimension,
        value: T[TDimension] | ((value?: T[TDimension]) => T[TDimension])
    ): Metric<T> {
        this.#metric[name] = typeof value === 'function' ? value(this.#metric[name]) : value

        return this
    }
}
