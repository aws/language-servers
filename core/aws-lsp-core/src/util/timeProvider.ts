export class TimeProvider {
    /** Number of milliseconds elapsed since Unix epoch */
    currentMilliseconds(): number {
        return Date.now()
    }
}
