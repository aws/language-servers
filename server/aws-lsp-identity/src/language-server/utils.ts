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
} from '@aws/language-server-runtimes/server-interface'
import { InitializeParams, HandlerResult, InitializeError } from 'vscode-languageserver'

export function ensureSsoAccountAccessScope(scopes?: string[]): string[] {
    const ssoAccountAccessScope = 'sso:account:access'

    if (!scopes) {
        scopes = [ssoAccountAccessScope]
    } else if (!scopes.includes(ssoAccountAccessScope)) {
        scopes.push(ssoAccountAccessScope)
    }

    return scopes
}

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
}
