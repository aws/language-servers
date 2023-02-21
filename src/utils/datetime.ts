export class Time {
    /** Number of milliseconds elapsed since Unix epoch */
    inMilliseconds(): number {
        return Date.now()
    }
}
