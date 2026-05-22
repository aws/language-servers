import * as assert from 'assert'
import { getWelcomeTabHeader } from './welcome'

describe('welcome', () => {
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

        it('exposes the tip body as one of the curated tips (no leakage of unrelated content)', () => {
            // Sample multiple times to give the random selector a fair chance to vary.
            const expectedTips = new Set([
                'You can now see logs with 1-Click!',
                'MCP is available in Amazon Q!',
                'Pinned context is always included in future chat messages',
                'Create and add Saved Prompts using the @ context menu',
                'Compact your conversation with /compact',
                'Ask Q to review your code and see results in the code issues panel!',
            ])
            for (let i = 0; i < 20; i++) {
                const body = getWelcomeTabHeader().tip?.body ?? ''
                assert.ok(expectedTips.has(body), `tip body "${body}" is not from the curated tip pool`)
            }
        })

        it('does not include any HTML markup or entities in tab-header fields (escaped by mynah-ui >= 4.40.2)', () => {
            // Regression guard: PR #2724 bumped @aws/mynah-ui to ^4.40.2 which
            // escapes inline HTML in markdown bodies (mynah-ui PR #484). The
            // welcome surface MUST stay HTML-free or it will render as visible
            // tags instead of styled UI.
            //
            // Catch both tag-like sequences (e.g. "<br>", "<br/>", "</div>")
            // and HTML entities (e.g. "&lt;", "&amp;"). A bare ampersand on
            // its own is fine because mynah-ui appends string fields via
            // insertAdjacentText (raw text, not HTML).
            const header = getWelcomeTabHeader()
            const fields: Array<[string, string]> = [
                ['title', header.title ?? ''],
                ['description', header.description ?? ''],
                ['tip.title', header.tip?.title ?? ''],
                ['tip.body', header.tip?.body ?? ''],
            ]
            const tagLike = /<\/?[a-zA-Z][^>]*>?/
            const entityLike = /&[a-zA-Z]+;|&#\d+;|&#x[0-9a-fA-F]+;/
            for (const [name, value] of fields) {
                assert.ok(!tagLike.test(value), `welcome field "${name}" contains an HTML tag: "${value}"`)
                assert.ok(!entityLike.test(value), `welcome field "${name}" contains an HTML entity: "${value}"`)
            }
        })
    })
})
