import * as assert from 'assert'
import { getRandomTip, getWelcomeTabHeader } from './welcome'

describe('welcome', () => {
    describe('getRandomTip', () => {
        it('returns a non-empty string from the tip pool', () => {
            const tip = getRandomTip()
            assert.strictEqual(typeof tip, 'string')
            assert.ok(tip.length > 0)
        })
    })

    describe('getWelcomeTabHeader', () => {
        it('renders the centered Amazon Q splash through tabHeaderDetails fields', () => {
            const header = getWelcomeTabHeader()
            assert.strictEqual(header.title, 'Amazon Q')
            assert.strictEqual(header.centered, true)
            assert.strictEqual(header.tip?.title, 'Did you know?')
            assert.ok(header.tip?.body && header.tip.body.length > 0)
            assert.ok(header.description && header.description.length > 0)
        })

        it('returns a fresh object each call so the random tip can rotate', () => {
            const a = getWelcomeTabHeader()
            const b = getWelcomeTabHeader()
            assert.notStrictEqual(a, b)
            assert.notStrictEqual(a.tip, b.tip)
        })

        it('does not include raw inline HTML in any tab-header field (escaped by mynah-ui >= 4.40.2)', () => {
            // Regression guard: PR #2724 bumped @aws/mynah-ui to ^4.40.2 which
            // escapes inline HTML in markdown bodies (mynah-ui PR #484). The
            // welcome surface MUST stay HTML-free or it will render as visible
            // tags instead of styled UI.
            const header = getWelcomeTabHeader()
            const fields = [
                header.title ?? '',
                header.description ?? '',
                header.tip?.title ?? '',
                header.tip?.body ?? '',
            ]
            for (const field of fields) {
                assert.ok(!/<\w+/.test(field), `unexpected HTML tag in welcome field: "${field}"`)
            }
        })
    })
})
