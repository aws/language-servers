import { expect, use } from 'chai'
import { ensureSsoAccountAccessScope } from './utils'

// eslint-disable-next-line @typescript-eslint/no-var-requires
use(require('chai-as-promised'))

describe('utils', () => {
    describe('ensureSsoAccountAccessScope', () => {
        it('Returns an array with sso:account:access if no scopes passed in', () => {
            const actual = ensureSsoAccountAccessScope(undefined)

            expect(actual).to.deep.equal(['sso:account:access'])
        })

        it('Returns an array with sso:account:access if empty scopes array passed in', () => {
            const actual = ensureSsoAccountAccessScope([])

            expect(actual).to.deep.equal(['sso:account:access'])
        })

        it('Returns an array with sso:account:access added if scopes passed in', () => {
            const actual = ensureSsoAccountAccessScope(['this', 'that'])

            expect(actual).to.deep.equal(['this', 'that', 'sso:account:access'])
        })

        it('Returns same array containing sso:account:access added if scopes with sso:account:access passed in', () => {
            const scopes = ['this', 'that', 'sso:account:access']
            const actual = ensureSsoAccountAccessScope(scopes)

            expect(actual).to.deep.equal(scopes)
        })
    })
})
