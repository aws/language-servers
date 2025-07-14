/**
 * This class tracks active user events based on time windows.
 * If multiple messages are sent within the same time window, it will count as a single active user event.
 * The time window is not reset by subsequent messages within the window.
 * A new message outside the window will reset the window and count as a new active user event.
 */

// Default window size in minutes (24 hours)
export const DEFAULT_ACTIVE_USER_WINDOW_MINUTES = 24 * 60

export class ActiveUserTracker {
    private static instance: ActiveUserTracker | undefined
    private windowStartTimestamp: number = -1
    private windowSizeMs: number

    private constructor(windowSizeMinutes: number = DEFAULT_ACTIVE_USER_WINDOW_MINUTES) {
        this.windowSizeMs = windowSizeMinutes * 60 * 1000
    }

    /**
     * Gets the singleton instance of ActiveUserTracker
     * @param windowSizeMinutes Size of the active user window in Minutes (default: DEFAULT_ACTIVE_USER_WINDOW_MINUTES)
     * @returns The ActiveUserTracker instance
     */
    public static getInstance(windowSizeMinutes: number = DEFAULT_ACTIVE_USER_WINDOW_MINUTES): ActiveUserTracker {
        if (!ActiveUserTracker.instance) {
            ActiveUserTracker.instance = new ActiveUserTracker(windowSizeMinutes)
        }
        return ActiveUserTracker.instance
    }

    /**
     * Determines if it should count as a new active user event
     * @returns true if this is a new active user event, false if it's within an existing window
     */
    public isNewActiveUser(): boolean {
        const currentTime = Date.now()

        // If this is the first message or the window has expired
        if (this.windowStartTimestamp === -1 || currentTime - this.windowStartTimestamp > this.windowSizeMs) {
            // This is a new active user event - start a new window
            this.windowStartTimestamp = currentTime
            return true
        }

        // Message is within the current window, do NOT update the timestamp
        // The window continues from its original start time
        return false
    }

    /**
     * Resets the tracker
     */
    public dispose(): void {
        this.windowStartTimestamp = -1
        ActiveUserTracker.instance = undefined
    }
}
