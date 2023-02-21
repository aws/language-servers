import { Connection } from 'vscode-languageserver'
import { TelemetryEvent } from 'yaml-language-server/out/server/src/languageservice/telemetry'

// This interface is from the yaml-language-server. We should get them to export it
export interface Telemetry {
    send(event: TelemetryEvent): void
    sendError(name: string, properties: unknown): void
    sendTrack(name: string, properties: unknown): void
}

export class YAMLTelemetry implements Telemetry {
    constructor(private connection: Connection) {}

    send(event: TelemetryEvent): void {
        // stub implementation
    }

    // The YAML language server sends error events in the form of:
    // yaml.${service}.error, { error: "the error message" }
    // e.g. yaml.documentSymbols.error, { error: "Could not get documents cache" }
    sendError(name: string, properties: unknown): void {
        this.connection.window.showErrorMessage(`${name}: ${properties}`)
    }

    sendTrack(name: string, properties: unknown): void {
        // stub implementation
    }
}
