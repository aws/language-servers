import { use } from 'chai'

// eslint-disable-next-line @typescript-eslint/no-var-requires
use(require('chai-as-promised'))

describe('RefreshingSsoCache', () => {
    describe('getSsoClientRegistration', () => {
        it('Creates a new SSO client registration.', async () => {})

        it('Updates an expired SSO client registration.', async () => {})
    })

    describe('setSsoClientRegistration', () => {
        it('Saves an SSO client registration to the next SSO cache.', async () => {})
    })

    describe('getSsoToken', () => {
        it('Returns nothing on no cached SSO token.', async () => {})

        it('Returns nothing on expired SSO token.', async () => {})

        it('Returns existing SSO token before refresh window (5 minutes before expiration).', async () => {})

        it('Returns existing SSO token when refresh attempted recently (within 30 seconds).', async () => {})

        it('Returns nothing when no refreshToken.', async () => {})

        it('Returns new SSO token upon refresh.', async () => {})
    })

    describe('setSsoToken', () => {
        it('Saves an SSO token to the next SSO cache.', async () => {})
    })
})
