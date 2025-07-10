# aws-lsp-notification: Notification Server

The AWS Notification Language Server provides a mechanism for delivering notifications to AWS Toolkit users across different IDEs. It leverages the Language Server Protocol (LSP) to communicate with client extensions.

## Overview

The notification server fetches notifications from configurable sources, filters them based on various criteria, and delivers them to the client. It also tracks which notifications have been acknowledged by the user to prevent showing the same notifications repeatedly.

## Key Components

### Fetchers

The server uses a chain of fetchers to retrieve and filter notifications:

1. **UriNotificationFetcher**: Fetches notifications from a URI source (HTTP, file, etc.)
2. **ConditionFilteringFetcher**: Filters notifications based on client state conditions
3. **MetadataFilteringFetcher**: Filters out notifications that have been acknowledged

### Notification Acknowledgement

The server supports two types of acknowledgement:

1. **Hard Acknowledgement**: When a user explicitly acknowledges a notification in the client (e.g., by clicking a button or link). This is persisted to disk via the MetadataStore and maintained across server restarts. It represents the user's explicit intent not to see the notification again.

2. **Soft Acknowledgement**: Set by the notification server once it has served a notification to the client during the current server process instance. This is only stored in memory and is cleared when the server process terminates. It prevents the server from repeatedly sending the same notifications to the client within a single session.

### Configuration

The notification source URL is provided by the client during the LSP initialization process via the `initializationOptions.aws.servers.notification.sourceUrl` property.

## Future Enhancements

This initial implementation will be expanded to support:

- Multiple notification sources
- More sophisticated filtering conditions
- Enhanced notification content (rich text, images, etc.)
- Additional client integrations beyond the current AWS Toolkit clients