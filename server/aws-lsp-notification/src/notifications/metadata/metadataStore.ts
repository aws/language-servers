export interface MetadataStore {
    load(): Promise<Metadata>
    save(metadata: Metadata): Promise<void>
}

export const MetadataSchemaVersion: string = '1.0'

export interface Metadata {
    schemaVersion: string
    acknowledged: Record<string, AcknowledgedNotification>
    // TODO-NOTIFY: Add support for ephemeral (in-memory only) acknowledgements
    // These would be used for "soft acknowledgements" that are only maintained
    // for the lifetime of the server process to prevent showing the same
    // notifications repeatedly within a single session
}

export interface AcknowledgedNotification {
    acknowledgedAt: string
    // TODO-NOTIFY: Add a field to distinguish between persistent (hard) and
    // ephemeral (soft) acknowledgements
}
