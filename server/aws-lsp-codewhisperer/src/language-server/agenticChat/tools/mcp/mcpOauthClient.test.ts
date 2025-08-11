/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { expect } from 'chai'
import * as sinon from 'sinon'
import * as crypto from 'crypto'
import * as http from 'http'
import { EventEmitter } from 'events'
import * as path from 'path'
import { OAuthClient } from './mcpOauthClient'

const fakeLogger = {
    log: () => {},
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
}

const fakeWorkspace = {
    fs: {
        exists: async (_path: string) => false,
        readFile: async (_path: string) => Buffer.from('{}'),
        writeFile: async (_path: string, _d: any) => {},
        mkdir: async (_dir: string, _opts: any) => {},
    },
} as any

function stubFileSystem(tokenObj?: any, regObj?: any): void {
    const cacheDir = (OAuthClient as any).cacheDir as string
    const tokPath = path.join(cacheDir, 'testkey.token.json')
    const regPath = path.join(cacheDir, 'testkey.registration.json')

    const existsStub = sinon.stub(fakeWorkspace.fs, 'exists')
    existsStub.callsFake(async (p: any) => {
        if (p === tokPath && tokenObj) return true
        if (p === regPath && regObj) return true
        return false
    })

    const readStub = sinon.stub(fakeWorkspace.fs, 'readFile')
    readStub.callsFake(async (p: any) => {
        if (p === tokPath && tokenObj) return Buffer.from(JSON.stringify(tokenObj))
        if (p === regPath && regObj) return Buffer.from(JSON.stringify(regObj))
        return Buffer.from('{}')
    })

    sinon.stub(fakeWorkspace.fs, 'writeFile').resolves()
    sinon.stub(fakeWorkspace.fs, 'mkdir').resolves()
}

function stubHttpServer(): void {
    sinon.stub(http, 'createServer').callsFake(() => {
        const srv = new EventEmitter() as unknown as http.Server & EventEmitter
        ;(srv as any).address = () => ({ address: '127.0.0.1', port: 12345, family: 'IPv4' })
        ;(srv as any).listen = (_port?: any, _host?: any, _backlog?: any, cb?: any) => {
            if (typeof cb === 'function') cb()
            // simulate async readiness like a real server
            process.nextTick(() => srv.emit('listening'))
            return srv
        }
        ;(srv as any).close = (cb?: any) => {
            if (typeof cb === 'function') cb()
            srv.removeAllListeners()
            return srv
        }
        return srv
    })
}

describe('OAuthClient helpers', () => {
    it('computeKey() generates deterministic SHA-256 hex', () => {
        const url = new URL('https://example.com/api')
        const expected = crypto
            .createHash('sha256')
            .update(url.origin + url.pathname)
            .digest('hex')
        const actual = (OAuthClient as any).computeKey(url)
        expect(actual).to.equal(expected)
    })

    it('b64url() strips padding and is URL-safe', () => {
        const buf = Buffer.from('hello')
        const actual = (OAuthClient as any).b64url(buf)
        expect(actual).to.equal('aGVsbG8')
    })
})

describe('OAuthClient getValidAccessToken()', () => {
    const now = Date.now()

    beforeEach(() => {
        sinon.restore()
        OAuthClient.initialize(fakeWorkspace, fakeLogger as any)
        sinon.stub(OAuthClient as any, 'computeKey').returns('testkey')
        stubHttpServer()
    })

    afterEach(() => sinon.restore())

    it('returns cached token when still valid', async () => {
        const cachedToken = {
            access_token: 'cached_access',
            expires_in: 3600,
            obtained_at: now - 1_000,
        }
        const cachedReg = {
            client_id: 'cid',
            redirect_uri: 'http://localhost:12345',
        }

        stubFileSystem(cachedToken, cachedReg)

        const token = await OAuthClient.getValidAccessToken(new URL('https://api.example.com/mcp'))
        expect(token).to.equal('cached_access')
        expect((http.createServer as any).calledOnce).to.be.true
    })
})
