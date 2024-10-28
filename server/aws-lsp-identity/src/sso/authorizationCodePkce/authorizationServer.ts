import * as path from 'path'
import http, { IncomingMessage, Server, ServerResponse } from 'http'
import { AwsError } from '../../awsError'
import { AwsErrorCodes } from '@aws/language-server-runtimes/protocol'
import { readFile } from 'fs/promises'
import { randomUUID } from 'crypto'

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

    private constructor(private readonly httpServer: Server) {
        this.httpServer.on('request', this.requesterListener.bind(this))

        // Detect ephemeral port
        const address = this.httpServer.address()
        if (
            !address ||
            typeof address === 'string' ||
            !Object.hasOwn(address, 'address') ||
            !Object.hasOwn(address, 'port')
        ) {
            throw new AwsError('Local server address not found.', AwsErrorCodes.E_CANNOT_CREATE_SSO_TOKEN)
        }

        this.origin = `http://${address.address}:${address.port}`
        this.#redirectUri = `${this.origin}${AuthorizationServer.authorizationPath}`

        // Set up authorization code promise
        let authResolve,
            authReject = undefined
        this.authPromise = new Promise<string>((resolve, reject) => {
            authResolve = resolve
            authReject = reject
        })
        this.authResolve = authResolve!
        this.authReject = authReject!
    }

    async [Symbol.dispose]() {
        this.httpServer.closeAllConnections()
        this.httpServer.close()
    }

    static async start(httpServer?: Server): Promise<AuthorizationServer> {
        httpServer ||= http.createServer()

        // Wait for server to start listening
        await new Promise<void>(resolve => {
            httpServer.once('listening', resolve)
            httpServer.listen(0, '127.0.0.1')
        })

        return new AuthorizationServer(httpServer)
    }

    async authorizationCode(): Promise<string> {
        return this.authPromise
    }

    private async requesterListener(req: IncomingMessage, res: ServerResponse): Promise<void> {
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
        if (!req.url) {
            return
        }

        try {
            const searchParams = new URL(req.url, this.origin).searchParams

            const error = searchParams.get('error')
            if (error) {
                throw new Error(`${error}: ${searchParams.get('error_description') ?? 'No description'}`)
            }

            const code = searchParams.get('code')
            if (!code) {
                throw new Error('Authorization code not found.')
            }

            const state = searchParams.get('state')
            if (!state) {
                throw new Error('CSRF state not found.')
            }

            if (state !== this.csrfState) {
                throw new Error('CSRF state is invalid.')
            }

            try {
                this.redirect(res)
            } finally {
                this.authResolve(code)
            }
        } catch (error) {
            try {
                this.redirect(res, error?.toString())
            } finally {
                this.authReject(error)
            }
        }
    }

    private redirect(res: ServerResponse, error?: string) {
        let redirectUri = `${this.origin}/index.html`
        if (error) {
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
