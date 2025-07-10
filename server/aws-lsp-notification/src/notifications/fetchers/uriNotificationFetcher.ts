import { Fetcher } from './fetcher'
import { Notification } from '../notification'
import { UriResolver } from '@aws/lsp-core'
import { Logging } from '@aws/language-server-runtimes/server-interface'

/**
 * Adapts the UriResolver from core/content to the Fetcher interface
 * for retrieving notifications from various URI sources
 */
export class UriNotificationFetcher implements Fetcher {
    /**
     * Creates a new UriNotificationFetcher
     * @param uriResolver The UriResolver to use for fetching content
     * @param uri The URI to fetch notifications from
     * @param logging The logging feature for error reporting
     */
    constructor(
        private readonly uriResolver: UriResolver,
        private readonly uri: string,
        private readonly logging: Logging
    ) {}

    /**
     * Fetches notifications from the configured URI
     * @returns An async generator that yields notifications
     */
    async *fetch(): AsyncGenerator<Notification> {
        try {
            // Fetch content using the UriResolver
            const content = await this.uriResolver(this.uri)

            // Parse the content as JSON
            const parsedContent = JSON.parse(content)

            // Handle different response formats
            if (Array.isArray(parsedContent)) {
                // If the response is an array of notifications
                yield* parsedContent as Notification[]
            } else if (parsedContent.notifications && Array.isArray(parsedContent.notifications)) {
                // If the response has a notifications property that is an array
                yield* parsedContent.notifications as Notification[]
            } else {
                // If the response is a single notification
                yield parsedContent as Notification
            }
        } catch (error) {
            this.logging.error(
                `Error fetching notifications: ${error instanceof Error ? error.message : String(error)}`
            )
            // For now, yield no notifications on error
            return
        }
    }
}
