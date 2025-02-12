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

export abstract class ServerBase implements Disposable {
    private _state: ServerState = ServerState.Created
    protected readonly observability: Observability
    protected readonly disposables: (Disposable | (() => void))[] = []

    get state(): ServerState {
        return this._state
    }

    private set state(value: ServerState) {
        if (this.state > value) {
            throw new AwsError(
                `Illegal state change in ${this.constructor.name} from ${ServerState[this.state]} to ${ServerState[value]}`,
                AwsErrorCodes.E_UNKNOWN
            )
        }
    }

    constructor(protected readonly features: Features) {
        this.features.lsp.addInitializer(this.initializer.bind(this))
        this.features.lsp.onInitialized(this.initialized.bind(this))
        this.observability = { logging: this.features.logging, telemetry: this.features.telemetry }
    }

    [Symbol.dispose]() {
        if (this.state === ServerState.Disposed) {
            return
        }

        this.state = ServerState.Disposing

        let disposable
        while ((disposable = this.disposables.pop())) {
            if (disposable instanceof Function) {
                disposable()
            } else if (Object.hasOwn(disposable, Symbol.dispose)) {
                disposable[Symbol.dispose]()
            }
        }

        this.state = ServerState.Disposed
    }

    private async initializer(
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
        return Promise.resolve({ capabilities: {} })
    }

    protected initialized(params: InitializedParams): void {
        this.state = ServerState.Initialized
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
