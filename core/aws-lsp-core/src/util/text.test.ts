import * as assert from 'assert'
import { sanitizeFilename } from './text'

describe('sanitizeFilename', function () {
    const cases: { input: string; output: string; case: string; replaceString?: string }[] = [
        { input: 'foo🤷', output: 'foo_', case: 'removes emojis' },
        { input: 'foo/zub', output: 'foo_zub', case: 'replaces slash with underscore' },
        { input: 'foo zub', output: 'foo_zub', case: 'replaces space with underscore' },
        { input: 'foo:bar', output: 'fooXbar', replaceString: 'X', case: 'replaces dot with replaceString' },
        { input: 'foo🤷bar/zu b.txt', output: 'foo_bar_zu_b.txt', case: 'docstring example' },
        { input: 'foo.txt', output: 'foo.txt', case: 'keeps dot' },
        { input: 'züb', output: 'züb', case: 'keeps special chars' },
    ]
    for (const testCase of cases) {
        it(testCase.case, function () {
            assert.strictEqual(sanitizeFilename(testCase.input, testCase.replaceString), testCase.output)
        })
    }
})
