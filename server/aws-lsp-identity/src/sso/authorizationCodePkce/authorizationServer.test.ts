import { expect, use } from 'chai'
import { AuthorizationServer } from './authorizationServer'
import * as http from 'http'

// eslint-disable-next-line @typescript-eslint/no-var-requires
use(require('chai-as-promised'))

async function httpGet(options: string | URL): Promise<{ data: string; statusCode?: number }> {
    return new Promise((resolve, reject) => {
        http.get(options, res => {
            let data = ''

            res.on('data', chunk => {
                data += chunk
            })

            res.on('end', () => {
                resolve({ data, statusCode: res.statusCode })
            })
        }).on('error', err => {
            reject(err)
        })
    })
}

describe('AuthorizationServer', () => {
    it('Creates a valid CSRF token', async () => {
        using sut = await AuthorizationServer.start()

        expect(sut.csrfState).to.not.be.empty
    })

    it('Creates a valid redirect URI', async () => {
        using sut = await AuthorizationServer.start()
        const actual = new URL(sut.redirectUri)

        expect(actual.hostname).to.equal('127.0.0.1')
        expect(actual.port).to.not.be.empty
        expect(actual.pathname).to.equal('/oauth/callback')
    })

    it('Returns a valid resource request.', async () => {
        using sut = await AuthorizationServer.start()
        const origin = new URL(sut.redirectUri).origin
        const { data } = await httpGet(`${origin}/index.html`)
        expect(data).contains('</html>')
    })

    it('Returns a 404 on invalid resource request.', async () => {
        using sut = await AuthorizationServer.start()
        const origin = new URL(sut.redirectUri).origin

        const { statusCode } = await httpGet(`${origin}/does_not_exist`)

        expect(statusCode).to.equal(404)
    })

    it('Returns an authorization code on valid authorization request.', async () => {
        using sut = await AuthorizationServer.start()

        await httpGet(`${sut.redirectUri}?code=whatever&state=${sut.csrfState}`)
        const actual = await sut.authorizationCode()

        expect(actual).to.equal('whatever')
    })

    for (const search of ['error=kaboom', 'code=', 'state=', 'state=not_it']) {
        it(`Throws an error on an invalid authorization request [${search}].`, async () => {
            using sut = await AuthorizationServer.start()

            await httpGet(`${sut.redirectUri}?${search}`)

            await expect(sut.authorizationCode()).rejectedWith()
        })
    }
})
