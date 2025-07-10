import { Fetcher } from './fetcher'
import { Notification } from '../notification'
import { ClientState } from '../clientState'

/**
 * Filters notifications based on client state conditions
 */
export class ConditionFilteringFetcher implements Fetcher {
    /**
     * Creates a new ConditionFilteringFetcher
     * @param next The next fetcher in the chain
     * @param clientState The client state to use for filtering
     */
    constructor(
        private readonly next: Fetcher,
        private readonly clientState?: ClientState
    ) {}

    /**
     * Fetches notifications from the next fetcher and filters them based on conditions
     * @returns An async generator that yields filtered notifications
     */
    async *fetch(): AsyncGenerator<Notification> {
        // If no client state is provided, pass through all notifications
        if (!this.clientState) {
            yield* this.next.fetch()
            return
        }

        // Fetch notifications from the next fetcher
        for await (const notification of this.next.fetch()) {
            // Check if the notification should be shown based on conditions
            if (this.shouldShowNotification(notification)) {
                yield notification
            }
        }
    }

    /**
     * Determines if a notification should be shown based on client state conditions
     * @param notification The notification to check
     * @returns True if the notification should be shown, false otherwise
     */
    private shouldShowNotification(notification: Notification): boolean {
        // TODO-NOTIFY: Implement condition filtering logic
        // This should check notification conditions against the client state

        // If the notification has no conditions, show it
        if (!notification.condition) {
            return true
        }

        // For now, return true for all notifications
        // This will be replaced with actual condition checking logic
        return true
    }
}
