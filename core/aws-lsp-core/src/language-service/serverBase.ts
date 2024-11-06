import {
    Chat,
    CredentialsProvider,
    IdentityManagement,
    Logging,
    Lsp,
    Notification,
    Runtime,
    Workspace,
    PartialInitializeResult,
    Telemetry,
    InitializeParams,
    HandlerResult,
    InitializeError,
    AwsErrorCodes,
    AwsResponseError,
    InitializedParams,
} from '@aws/language-server-runtimes/server-interface'
import { AwsError } from '../util/awsError'

// TODO In a future PR when schedule permits, migrate this to language-server-runtimes/server-interface/server
// for reuse in Server type parameter
export interface ServerFeatures {
    chat: Chat
    credentialsProvider: CredentialsProvider
    identityManagement: IdentityManagement
    logging: Logging
    lsp: Lsp
    notification: Notification
    runtime: Runtime
    telemetry: Telemetry
    workspace: Workspace
}

export interface Observability {
    logging: Logging
    telemetry: Telemetry
}

export abstract class ServerBase implements Disposable {
    protected readonly observability: Observability
    protected readonly disposables: (Disposable | (() => void))[] = []

    constructor(protected readonly features: ServerFeatures) {
        this.features.lsp.addInitializer(params => this.initialize(params))
        this.features.lsp.onInitialized(params => this.initialized(params))
        this.observability = { logging: this.features.logging, telemetry: this.features.telemetry }
    }

    [Symbol.dispose]() {
        let disposable
        while ((disposable = this.disposables.pop())) {
            if (disposable instanceof Function) {
                disposable()
            } else if (Object.hasOwn(disposable, Symbol.dispose)) {
                disposable[Symbol.dispose]()
            }
        }
    }

    protected abstract initialize(
        params: InitializeParams
    ): HandlerResult<PartialInitializeResult<any>, InitializeError>

    protected abstract initialized(params: InitializedParams): void

    // AwsResponseError should only be instantied and used at the server class level.  All other code should use
    // the LSP-agnostic AwsError class instead.  Each handler call should use this function to wrap the functional
    // call and emit an AwsResponseError in all failure cases.  If a better awsErrorCode than E_UNKNOWN can be
    // assumed at the call site, it can be provided as an arg, otherwise E_UNKNOWN as default is fine.
    // Following the error pattern, the inner most error message and awsErrorCode should be returned.
    protected wrapInAwsResponseError(error: Error, awsErrorCode: string = AwsErrorCodes.E_UNKNOWN): AwsResponseError {
        return new AwsResponseError(error?.message ?? 'Unknown error', {
            awsErrorCode: error instanceof AwsError ? error.awsErrorCode : awsErrorCode,
        })
    }
}
