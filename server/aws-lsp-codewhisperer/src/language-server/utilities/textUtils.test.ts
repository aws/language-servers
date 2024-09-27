// Partial port of implementation in AWS Toolkit for VSCode
// https://github.com/aws/aws-toolkit-vscode/blob/0c4289b1a0b5d294cc352f7d2e7e586937ac0318/packages/core/src/test/shared/utilities/textUtilities.test.ts

import * as assert from 'assert'
import { undefinedIfEmpty } from './textUtils'

describe('undefinedIfEmpty', function () {
    const cases: { input: string | undefined; output: string | undefined; case: string }[] = [
        { input: undefined, output: undefined, case: 'return undefined if input is undefined' },
        { input: '', output: undefined, case: 'return undefined if input is empty string' },
        { input: '   ', output: undefined, case: 'return undefined if input is blank' },
        { input: 'foo', output: 'foo', case: 'return str if input is not empty' },
        { input: ' foo ', output: ' foo ', case: 'return original str without trim' },
    ]

    cases.forEach(testCases => {
        it(testCases.case, function () {
            assert.strictEqual(undefinedIfEmpty(testCases.input), testCases.output)
        })
    })
})
