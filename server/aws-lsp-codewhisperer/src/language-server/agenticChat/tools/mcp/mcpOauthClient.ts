/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import fetch, { type RequestInit } from 'node-fetch'
import * as crypto from 'crypto'
import * as path from 'path'
import { spawn } from 'child_process'
import { URL, URLSearchParams } from 'url'
import * as http from 'http'
import { Logger, Workspace } from '@aws/language-server-runtimes/server-interface'

interface Token {
    access_token: string
    expires_in: number
    refresh_token?: string
    obtained_at: number
}

interface Meta {
    authorization_endpoint: string
    token_endpoint: string
    registration_endpoint?: string
}

interface Registration {
    client_id: string
    client_secret?: string
    expires_at?: number
    redirect_uri: string
}

export class OAuthClient {
    private static logger: Logger
    private static workspace: Workspace

    public static initialize(ws: Workspace, logger: Logger): void {
        this.workspace = ws
        this.logger = logger
    }

    /**
     * Return a valid Bearer token, reusing cache or refresh-token if possible,
     * otherwise driving one interactive PKCE flow.
     */
    public static async getValidAccessToken(mcpBase: URL): Promise<string> {
        const key = this.computeKey(mcpBase)
        const regPath = path.join(this.cacheDir, `${key}.registration.json`)
        const tokPath = path.join(this.cacheDir, `${key}.token.json`)

        // 1) Spin up (or reuse) loopback server + redirect URI
        let server: http.Server, redirectUri: string
        const savedReg = await this.read<Registration>(regPath)
        if (savedReg) {
            const port = Number(new URL(savedReg.redirect_uri).port)
            server = http.createServer()
            try {
                await new Promise<void>(res => server.listen(port, '127.0.0.1', res))
                redirectUri = savedReg.redirect_uri
                this.logger.info(`OAuth: reusing redirect URI ${redirectUri}`)
            } catch (e: any) {
                if (e.code === 'EADDRINUSE') {
                    this.logger.warn(`Port ${port} in use; falling back to new random port`)
                    ;({ server, redirectUri } = await this.buildCallbackServer())
                    this.logger.info(`OAuth: new redirect URI ${redirectUri}`)
                    await this.workspace.fs.rm(regPath)
                } else {
                    throw e
                }
            }
        } else {
            ;({ server, redirectUri } = await this.buildCallbackServer())
            this.logger.info(`OAuth: new redirect URI ${redirectUri}`)
        }

        try {
            // 2) Try still-valid cached access_token
            const cached = await this.read<Token>(tokPath)
            if (cached) {
                const expiry = cached.obtained_at + cached.expires_in * 1000
                if (Date.now() < expiry) {
                    this.logger.info(`OAuth: using still‑valid cached token`)
                    return cached.access_token
                }
                this.logger.info(`OAuth: cached token expired → try refresh`)
            }

            // 3) Discover AS metadata
            let meta: Meta
            try {
                meta = await this.discoverAS(mcpBase)
            } catch (e: any) {
                throw new Error(`OAuth discovery failed: ${e?.message ?? String(e)}`)
            }
            // 4) Register (or reuse) a dynamic client
            const scopes = ['openid', 'offline_access']
            let reg: Registration
            try {
                reg = await this.obtainClient(meta, regPath, scopes, redirectUri)
            } catch (e: any) {
                throw new Error(`OAuth client registration failed: ${e?.message ?? String(e)}`)
            }

            // 5) Refresh‑token grant (one shot)
            const attemptedRefresh = !!cached?.refresh_token
            if (cached?.refresh_token) {
                const refreshed = await this.refreshGrant(meta, reg, mcpBase, cached.refresh_token)
                if (refreshed) {
                    await this.write(tokPath, refreshed)
                    this.logger.info(`OAuth: refresh grant succeeded`)
                    return refreshed.access_token
                }
                this.logger.info(`OAuth: refresh grant failed`)
            }

            // 6) PKCE interactive flow
            try {
                const fresh = await this.pkceGrant(meta, reg, mcpBase, scopes, redirectUri, server)
                await this.write(tokPath, fresh)
                return fresh.access_token
            } catch (e: any) {
                const suffix = attemptedRefresh ? ' after refresh attempt' : ''
                throw new Error(`OAuth authorization (PKCE) failed${suffix}: ${e?.message ?? String(e)}`)
            }
        } finally {
            await new Promise<void>(res => server.close(() => res()))
        }
    }

    // Spin up a one‑time HTTP listener on localhost:randomPort */
    private static async buildCallbackServer(): Promise<{ server: http.Server; redirectUri: string }> {
        const server = http.createServer()
        const port = await new Promise<number>(res =>
            server.listen(0, '127.0.0.1', () => res((server.address() as any).port))
        )
        return { server, redirectUri: `http://localhost:${port}` }
    }

    /** Discover OAuth endpoints by HEAD/WWW‑Authenticate, well‑known, or fallback */
    private static async discoverAS(rs: URL): Promise<Meta> {
        // a) HEAD → WWW‑Authenticate → resource_metadata
        try {
            const h = await fetch(rs.toString(), { method: 'HEAD' })
            const header = h.headers.get('www-authenticate') || ''
            const m = /resource_metadata=(?:"([^"]+)"|([^,\s]+))/i.exec(header)
            if (m) {
                const metaUrl = new URL(m[1] || m[2], rs).toString()
                this.logger.info(`OAuth: resource_metadata → ${metaUrl}`)
                const raw = await this.json<any>(metaUrl)
                return await this.fetchASFromResourceMeta(raw, metaUrl)
            }
        } catch {
            // ignore and fallback
        }

        // b) well‑known on resource host
        const probes = [
            new URL('.well-known/oauth-authorization-server', rs).toString(),
            new URL('.well-known/openid-configuration', rs).toString(),
            `${rs.origin}/.well-known/oauth-authorization-server`,
            `${rs.origin}/.well-known/openid-configuration`,
        ]
        for (const url of probes) {
            try {
                this.logger.info(`OAuth: probing ${url}`)
                return await this.json<Meta>(url)
            } catch {
                // next
            }
        }

        // c) fallback to static OAuth2 endpoints
        const base = (rs.origin + rs.pathname).replace(/\/+$/, '')
        this.logger.warn(`OAuth: synthesising endpoints from ${base}`)
        return {
            authorization_endpoint: `${base}/authorize`,
            token_endpoint: `${base}/access_token`,
        }
    }

    /** Follow `authorization_server(s)` in resource_metadata JSON */
    private static async fetchASFromResourceMeta(raw: any, metaUrl: string): Promise<Meta> {
        let asBase = raw.authorization_server
        if (!asBase && Array.isArray(raw.authorization_servers)) {
            asBase = raw.authorization_servers[0]
        }
        if (!asBase) {
            throw new Error(`resource_metadata at ${metaUrl} lacked authorization_server(s)`)
        }

        // Attempt both OAuth‑AS and OIDC well‑known
        for (const p of ['.well-known/oauth-authorization-server', '.well-known/openid-configuration']) {
            try {
                return await this.json<Meta>(new URL(p, asBase).toString())
            } catch {
                // next
            }
        }
        // fallback to static OAuth2 endpoints
        this.logger.warn(`OAuth: no well-known on ${asBase}, falling back to static endpoints`)
        return {
            authorization_endpoint: `${asBase}/authorize`,
            token_endpoint: `${asBase}/access_token`,
        }
    }

    /** DCR: POST client metadata → client_id; cache to disk */
    private static async obtainClient(
        meta: Meta,
        file: string,
        scopes: string[],
        redirectUri: string
    ): Promise<Registration> {
        const existing = await this.read<Registration>(file)
        if (existing && (!existing.expires_at || existing.expires_at * 1000 > Date.now())) {
            this.logger.info(`OAuth: reusing client_id ${existing.client_id}`)
            return existing
        }

        if (!meta.registration_endpoint) {
            throw new Error('OAuth: AS does not support dynamic registration')
        }

        const body = {
            client_name: 'AWS MCP LSP',
            grant_types: ['authorization_code', 'refresh_token'],
            response_types: ['code'],
            token_endpoint_auth_method: 'none',
            scope: scopes.join(' '),
            redirect_uris: [redirectUri],
        }
        const resp: any = await this.json(meta.registration_endpoint, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body),
        })

        const reg: Registration = {
            client_id: resp.client_id,
            client_secret: resp.client_secret,
            expires_at: resp.client_secret_expires_at,
            redirect_uri: redirectUri,
        }
        await this.write(file, reg)
        return reg
    }

    /** Try one refresh_token grant; returns new Token or `undefined` */
    private static async refreshGrant(
        meta: Meta,
        reg: Registration,
        rs: URL,
        refresh: string
    ): Promise<Token | undefined> {
        const form = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refresh,
            client_id: reg.client_id,
            resource: rs.toString(),
        })
        const res = await fetch(meta.token_endpoint, {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body: form,
        })
        if (!res.ok) {
            const msg = await res.text().catch(() => '')
            this.logger.warn(`OAuth: refresh grant HTTP ${res.status} — ${msg?.slice(0, 300)}`)
            return undefined
        }
        const j = (await res.json()) as Record<string, unknown>
        return { ...(j as object), obtained_at: Date.now() } as Token
    }

    /** One PKCE flow: browser + loopback → code → token */
    private static async pkceGrant(
        meta: Meta,
        reg: Registration,
        rs: URL,
        scopes: string[],
        redirectUri: string,
        server: http.Server
    ): Promise<Token> {
        // a) generate PKCE params
        const verifier = this.b64url(crypto.randomBytes(32))
        const challenge = this.b64url(crypto.createHash('sha256').update(verifier).digest())
        const state = this.b64url(crypto.randomBytes(16))

        // b) build authorize URL + launch browser
        const authz = new URL(meta.authorization_endpoint)
        authz.search = new URLSearchParams({
            client_id: reg.client_id,
            response_type: 'code',
            code_challenge: challenge,
            code_challenge_method: 'S256',
            resource: rs.toString(),
            scope: scopes.join(' '),
            redirect_uri: redirectUri,
            state: state,
        }).toString()

        const opener =
            process.platform === 'win32'
                ? { cmd: 'cmd', args: ['/c', 'start', authz.toString()] }
                : process.platform === 'darwin'
                  ? { cmd: 'open', args: [authz.toString()] }
                  : { cmd: 'xdg-open', args: [authz.toString()] }

        void spawn(opener.cmd, opener.args, { detached: true, stdio: 'ignore' }).unref()

        // c) wait for code on our loopback
        const { code, rxState, err } = await new Promise<{ code: string; rxState: string; err?: string }>(resolve => {
            server.on('request', (req, res) => {
                const u = new URL(req.url || '/', redirectUri)
                const c = u.searchParams.get('code') || ''
                const s = u.searchParams.get('state') || ''
                const e = u.searchParams.get('error') || undefined
                res.writeHead(200, { 'content-type': 'text/html' }).end('<h2>You may close this tab.</h2>')
                resolve({ code: c, rxState: s, err: e })
            })
        })
        if (err) throw new Error(`Authorization error: ${err}`)
        if (!code || rxState !== state) throw new Error('Invalid authorization response (state mismatch)')

        // d) exchange code for token
        const form2 = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            code_verifier: verifier,
            client_id: reg.client_id,
            redirect_uri: redirectUri,
            resource: rs.toString(),
        })
        const res2 = await fetch(meta.token_endpoint, {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body: form2,
        })
        if (!res2.ok) {
            const txt = await res2.text().catch(() => '')
            throw new Error(`Token exchange failed (HTTP ${res2.status}): ${txt?.slice(0, 300)}`)
        }
        const tk = (await res2.json()) as Record<string, unknown>
        return { ...(tk as object), obtained_at: Date.now() } as Token
    }

    /** Fetch + error‑check + parse JSON */
    private static async json<T>(url: string, init?: RequestInit): Promise<T> {
        const r = await fetch(url, init)
        if (!r.ok) {
            const txt = await r.text().catch(() => '')
            throw new Error(`HTTP ${r.status}@${url} — ${txt}`)
        }
        return (await r.json()) as T
    }

    /** Read & parse JSON file via workspace.fs */
    private static async read<T>(file: string): Promise<T | undefined> {
        try {
            if (!(await this.workspace.fs.exists(file))) return undefined
            const buf = await this.workspace.fs.readFile(file)
            return JSON.parse(buf.toString()) as T
        } catch {
            return undefined
        }
    }

    /** Write JSON, then clamp file perms to 0600 (owner read/write) */
    private static async write(file: string, obj: unknown): Promise<void> {
        const dir = path.dirname(file)
        await this.workspace.fs.mkdir(dir, { recursive: true })
        await this.workspace.fs.writeFile(file, JSON.stringify(obj, null, 2), { mode: 0o600 })
    }

    /** SHA‑256 of resourceServer URL → hex key */
    private static computeKey(rs: URL): string {
        return crypto
            .createHash('sha256')
            .update(rs.origin + rs.pathname)
            .digest('hex')
    }

    /** RFC‑7636 base64url without padding */
    private static b64url(buf: Buffer): string {
        return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    }

    /** Directory for caching registration + tokens */
    private static readonly cacheDir = path.join(
        process.env.HOME || process.env.USERPROFILE || '.',
        '.aws',
        'sso',
        'cache'
    )
}
