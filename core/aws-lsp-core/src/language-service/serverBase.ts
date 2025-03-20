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
