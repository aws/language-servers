import { expect, use } from 'chai'
import { tryAsync } from './utils'

// eslint-disable-next-line @typescript-eslint/no-var-requires
use(require('chai-as-promised'))

describe('utils', () => {
    describe('throwOnInvalidClientName', () => {
        it('Does nothing on valid client names.', () => {})

        it('Throws on invalid client names.', () => {})
    })

    describe('throwOnInvalidClientRegistration', () => {
        it('Does nothing on valid client registrations.', () => {})

        it('Throws on invalid client registrations.', () => {})
    })

    describe('throwOnInvalidSsoSession', () => {
        it('Does nothing on valid SSO sessions.', () => {})

        it('Throws on invalid SSO sessions.', () => {})
    })

    describe('tryAsync', () => {
        it('tryAsync returns value on success', async () => {
            const actual = await tryAsync(
                () => Promise.resolve('success has been so easy for you'),
                error => new Error('bad news')
            )

            expect(actual).to.equal('success has been so easy for you')
        })

        it('tryAsync throws error on failure', async () => {
            await expect(
                tryAsync(
                    () => {
                        throw new Error('and I can put you back down too')
                    },
                    error => error
                )
            ).to.be.rejectedWith('and I can put you back down too')
        })
    })

    describe('UpdateSsoTokenFromCreateToken', () => {
        it('Creates a new SSO token from the create token response.', () => {})

        it('Updates an existing SSO token from the create token response.', () => {})

        it('Throws on invalid create token response.', () => {})
    })
})
