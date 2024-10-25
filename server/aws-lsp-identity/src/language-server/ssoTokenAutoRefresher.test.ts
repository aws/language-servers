import { use } from 'chai'

// eslint-disable-next-line @typescript-eslint/no-var-requires
use(require('chai-as-promised'))

describe('SsoTokenAutoRefresher', () => {
    it('watch does nothing if SSO token is not loaded from cache.', () => {})

    it('watch does nothing if SSO token is expired.', () => {})

    it('watch schedules refresh in refresh window (5 minutes) prior to expiration.', () => {})

    it('watch schedules refresh retry in retry window (30 seconds) after last attempt.', () => {})

    it('unwatch does nothing if ssoSessionName is not watched.', () => {})
})
