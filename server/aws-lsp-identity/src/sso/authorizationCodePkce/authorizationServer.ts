import * as path from 'path'
import http, { IncomingMessage, Server, ServerResponse } from 'http'
import { AwsErrorCodes, CancellationToken } from '@aws/language-server-runtimes/protocol'
import { readFile } from 'fs/promises'
import { randomUUID } from 'crypto'
import { AwsError, Observability } from '@aws/lsp-core'

export class AuthorizationServer implements Disposable {
    private static readonly authorizationPath = '/oauth/callback'
    private static readonly browserTimeoutMillis = 5 * 60 * 1000

    private readonly origin: string
    private readonly authPromise: Promise<string>
    private readonly authResolve: (value: string) => void
    private readonly authReject: (reason?: any) => void

    readonly #csrfState = randomUUID()
    get csrfState(): string {
        return this.#csrfState
    }

    readonly #redirectUri: string
    get redirectUri(): string {
        return this.#redirectUri
    }

    private constructor(
        private readonly clientName: string,
        private readonly observability: Observability,
        private readonly httpServer: Server,
        token?: CancellationToken
    ) {
        this.httpServer.on('request', this.requesterListener.bind(this))

        // Detect ephemeral port
        const address = this.httpServer.address()
        if (
            !address ||
            typeof address === 'string' ||
            !Object.hasOwn(address, 'address') ||
            !Object.hasOwn(address, 'port')
        ) {
            this.observability.logging.log('Local authorization web server address not found.')
            throw new AwsError(
                'Local authorization web server address not found.',
                AwsErrorCodes.E_CANNOT_CREATE_SSO_TOKEN
            )
        }

        this.origin = `http://${address.address}:${address.port}`
        this.#redirectUri = `${this.origin}${AuthorizationServer.authorizationPath}`

        // Set up authorization code promise
        let authResolve, authReject
        this.authPromise = new Promise<string>((resolve, reject) => {
            authResolve = resolve
            authReject = reject
        })
        this.authResolve = authResolve!
        this.authReject = authReject!

        token?.onCancellationRequested(this.authReject)
    }

    async [Symbol.dispose]() {
        this.observability.logging.log('Disposing of local authorization web server.')
        this.httpServer.closeAllConnections()
        this.httpServer.close()
    }

    static async start(
        clientName: string,
        observability: Observability,
        httpServer?: Server,
        token?: CancellationToken
    ): Promise<AuthorizationServer> {
        observability.logging.log('Starting local authorization web server...')
        httpServer ||= http.createServer()

        // Wait for server to start listening
        await new Promise<void>(resolve => {
            httpServer!.once('listening', resolve)
            httpServer!.listen(0, '127.0.0.1')
            observability.logging.log('Local authorization web server started.')
        })

        return new AuthorizationServer(clientName, observability, httpServer, token)
    }

    async authorizationCode(): Promise<string> {
        return this.authPromise
    }

    private async requesterListener(req: IncomingMessage, res: ServerResponse): Promise<void> {
        this.observability.logging.log('Web request received on local authorization web server.')
        if (!req.url) {
            return
        }

        res.setHeader('Access-Control-Allow-Methods', 'GET')

        if (new URL(req.url, this.origin).pathname === AuthorizationServer.authorizationPath) {
            this.authorizationRequest(req, res)
        } else {
            this.resourceRequest(req, res)
        }
    }

    private authorizationRequest(req: IncomingMessage, res: ServerResponse) {
        this.observability.logging.log('Authorization web request received on local authorization web server.')
        if (!req.url) {
            return
        }

        try {
            const searchParams = new URL(req.url, this.origin).searchParams

            const error = searchParams.get('error')
            if (error) {
                this.observability.logging.log(`Error on authorization redirect: ${error}`)
                throw new AwsError(
                    `${error}: ${searchParams.get('error_description') ?? 'No description'}`,
                    AwsErrorCodes.E_CANNOT_CREATE_SSO_TOKEN
                )
            }

            const code = searchParams.get('code')
            if (!code) {
                this.observability.logging.log('Authorization code not found.')
                throw new AwsError('Authorization code not found.', AwsErrorCodes.E_CANNOT_CREATE_SSO_TOKEN)
            }

            const state = searchParams.get('state')
            if (!state) {
                this.observability.logging.log('CSRF state not found.')
                throw new AwsError('CSRF state not found.', AwsErrorCodes.E_CANNOT_CREATE_SSO_TOKEN)
            }

            if (state !== this.csrfState) {
                this.observability.logging.log('CSRF state is invalid.')
                throw new AwsError('CSRF state is invalid.', AwsErrorCodes.E_CANNOT_CREATE_SSO_TOKEN)
            }

            try {
                this.redirect(res)
            } finally {
                this.observability.logging.log('Authorization code returned.')
                this.authResolve(code)
            }
        } catch (error) {
            try {
                this.redirect(res, error?.toString())
            } finally {
                this.observability.logging.log('Authorization redirect failed.')
                this.authReject(error)
            }
        }
    }

    private redirect(res: ServerResponse, error?: string) {
        this.observability.logging.log('Redirecting to local web page.')
        let redirectUri = `${this.origin}/index.html?clientName=${this.clientName}`
        if (error) {
            this.observability.logging.log(`Redirecting to local web page with error: ${error}.`)
            redirectUri += `?${new URLSearchParams({ error })}`
        }

        res.setHeader('Location', redirectUri)
        res.writeHead(302)
        res.end()
    }

    private async resourceRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
        if (!req.url) {
            return
        }

        try {
            const resource = await readFile(path.join(__dirname, 'resources', new URL(req.url, this.origin).pathname))
            res.writeHead(200) // OK
            res.end(resource)
        } catch {
            res.writeHead(404) // NOT FOUND
            res.end()
        }
    }
}
