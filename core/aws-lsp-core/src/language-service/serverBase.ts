import {
    Logging,
    PartialInitializeResult,
    Telemetry,
    InitializeParams,
    InitializeError,
    AwsErrorCodes,
    AwsResponseError,
    InitializedParams,
    ResponseError,
    LSPErrorCodes,
} from '@aws/language-server-runtimes/server-interface'
import { AwsError } from '../util/awsError'
import { Features } from '@aws/language-server-runtimes/server-interface/server'

export interface Observability {
    logging: Logging
    telemetry: Telemetry
}

export enum ServerState {
    Created,
    Initializing,
    Initialized,
    Disposing,
    Disposed,
}

export type Disposables = (Disposable | (() => unknown))[]

export function disposeAll(disposables: Disposables): void {
    let disposable
    while ((disposable = disposables.pop())) {
        if (disposable instanceof Function) {
            disposable()
        } else if (Object.hasOwn(disposable, Symbol.dispose)) {
            disposable[Symbol.dispose]()
        }
    }
}

/**
 * ServerBase provides the foundation for Language Server Protocol (LSP) servers in the AWS Flare framework.
 *
 * In the AWS Flare architecture, there is an important distinction between "Server" and "Service" classes:
 *
 * - Server classes (like those extending ServerBase):
 *   - Act as the main entry point for LSP integration
 *   - Handle protocol-specific concerns (initialization, configuration changes, message handling)
 *   - Manage the lifecycle of server components
 *   - Implement the JSON-RPC interface between client and server
 *   - Delegate actual business logic to Service classes
 *
 * - Service classes:
 *   - Contain the core business logic
 *   - Are not directly tied to LSP, making them potentially reusable in other contexts
 *   - Handle the actual work that the server needs to perform
 *   - Coordinate between different components
 *
 * This separation improves modularity and testability by decoupling protocol/transport concerns
 * from business logic implementation.
 */
export abstract class ServerBase implements Disposable {
    #state: ServerState = ServerState.Created
    protected readonly name: string
    protected readonly dataDirPath: string
    protected readonly observability: Observability
    protected readonly disposables: Disposables = []

    get state(): ServerState {
        return this.#state
    }

    private set state(value: ServerState) {
        if (this.state > value) {
            throw new AwsError(
                `Illegal state change in ${this.displayName} from ${ServerState[this.state]} to ${ServerState[value]}`,
                AwsErrorCodes.E_UNKNOWN
            )
        }

        this.#state = value
    }

    constructor(
        readonly displayName: string,
        protected readonly features: Features
    ) {
        this.features.logging.info(`Creating ${this.displayName}`)
        this.features.lsp.addInitializer(this.initializeCore.bind(this))
        this.features.lsp.onInitialized(this.initializedCore.bind(this))
        this.name = this.constructor.name
        this.dataDirPath = this.features.workspace.fs.getServerDataDirPath(this.name)
        this.observability = { logging: this.features.logging, telemetry: this.features.telemetry }
    }

    [Symbol.dispose]() {
        if (this.state >= ServerState.Disposing) {
            return
        }

        this.state = ServerState.Disposing
        disposeAll(this.disposables)
        this.state = ServerState.Disposed
    }

    private async initializeCore(
        params: InitializeParams
    ): Promise<PartialInitializeResult<any> | ResponseError<InitializeError>> {
        try {
            return await this.initialize(params)
        } catch (error) {
            return new ResponseError<InitializeError>(
                LSPErrorCodes.RequestFailed,
                error?.toString() ?? 'Unknown error',
                { retry: (error as InitializeError)?.retry === true }
            )
        }
    }

    protected initialize(params: InitializeParams): Promise<PartialInitializeResult<any>> {
        this.state = ServerState.Initializing
        return Promise.resolve({
            capabilities: {},
            serverInfo: {
                name: this.displayName,
            },
        })
    }

    private async initializedCore(params: InitializedParams): Promise<void> {
        // eslint-disable-next-line no-extra-semi
        ;(async () => {
            try {
                await this.initialized(params)
            } catch (error) {
                this.observability.logging.error(`Initialized failed in ${this.displayName}. ${error}`)
            }
        })()
    }

    protected initialized(params: InitializedParams): Promise<void> {
        this.state = ServerState.Initialized
        return Promise.resolve()
    }

    // AwsResponseError should only be instantiated and used at the server-class level.  All other code should use
    // the LSP-agnostic AwsError class instead.  Each handler call should use this function to wrap the functional
    // call and emit an AwsResponseError in all failure cases.  If a better awsErrorCode than E_UNKNOWN can be
    // assumed at the call site, it can be provided as an arg, otherwise E_UNKNOWN as default is fine.
    // Following the error pattern, the inner most error message and awsErrorCode should be returned.
    protected wrapInAwsResponseError(
        error?: unknown,
        awsErrorCode: string = AwsErrorCodes.E_UNKNOWN
    ): AwsResponseError {
        return new AwsResponseError(error?.toString() ?? 'Unknown error', {
            awsErrorCode: error instanceof AwsError ? error.awsErrorCode : awsErrorCode,
        })
    }
}
