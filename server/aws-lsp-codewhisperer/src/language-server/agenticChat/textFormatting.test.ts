import * as assert from 'assert'
import { unescapeHtml } from './textFormatting'

describe('textFormatting', () => {
    describe('unescapeHtml', () => {
        it('unescapes HTML entities', () => {
            assert.strictEqual(unescapeHtml('&lt;div&gt;'), '<div>')
            assert.strictEqual(unescapeHtml('&quot;hello&quot;'), '"hello"')
            assert.strictEqual(unescapeHtml('&#39;world&#39;'), "'world'")
            assert.strictEqual(unescapeHtml('foo &amp; bar'), 'foo & bar')
        })

        it('unescapes backslash-escaped angle brackets', () => {
            assert.strictEqual(unescapeHtml('\\<tag\\>'), '<tag>')
            assert.strictEqual(unescapeHtml('a \\< b \\> c'), 'a < b > c')
        })

        it('handles both HTML entities and backslash escaping together', () => {
            const input = '[!@#$%^&amp;*()_+\\-=\\[\\]{}|;&#39;:&quot;,./\\<\\>?]'
            const expected = '[!@#$%^&*()_+\\-=\\[\\]{}|;\':\",./<>?]'
            assert.strictEqual(unescapeHtml(input), expected)
        })

        it('handles regex patterns with escaped characters', () => {
            const input = "re.search(r'[!@#$%^&amp;*()_+\\-=\\[\\]{}|;&#39;:&quot;,./\\<\\>?]', password)"
            const expected = "re.search(r'[!@#$%^&*()_+\\-=\\[\\]{}|;\':\",./<>?]', password)"
            assert.strictEqual(unescapeHtml(input), expected)
        })

        it('returns unchanged text when no escaping is present', () => {
            assert.strictEqual(unescapeHtml('hello world'), 'hello world')
            assert.strictEqual(unescapeHtml('no special chars'), 'no special chars')
        })

        it('handles empty string', () => {
            assert.strictEqual(unescapeHtml(''), '')
        })

        it('handles mixed content', () => {
            assert.strictEqual(
                unescapeHtml('Text with &lt;html&gt; and \\<escaped\\> brackets'),
                'Text with <html> and <escaped> brackets'
            )
        })
    })
})
