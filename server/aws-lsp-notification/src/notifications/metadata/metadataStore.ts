export interface MetadataStore {
    load(): Promise<Metadata>
    save(metadata: Metadata): Promise<void>
}

export const MetadataSchemaVersion: string = '1.0'

export interface Metadata {
    schemaVersion: string
    acknowledged: Record<string, AcknowledgedNotification>
}

export interface AcknowledgedNotification {
    acknowledgedAt: string
}
