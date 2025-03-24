/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { isTestFile } from './codeParsingUtil'
import * as assert from 'assert'

describe('isTestFile', () => {
    it('should return true if the file name matches the test filename pattern - Java', async () => {
        const filePaths = ['/path/to/MyClassTest.java', '/path/to/TestMyClass.java', '/path/to/MyClassTests.java']
        const language = 'java'

        for (const filePath of filePaths) {
            const result = await isTestFile(filePath, { languageId: language })
            assert.strictEqual(result, true)
        }
    })

    it('should return false if the file name does not match the test filename pattern - Java', async () => {
        const filePaths = ['/path/to/MyClass.java', '/path/to/MyClass_test.java', '/path/to/test_MyClass.java']
        const language = 'java'

        for (const filePath of filePaths) {
            const result = await isTestFile(filePath, { languageId: language })
            assert.strictEqual(result, false)
        }
    })

    it('should return true if the file name does not match the test filename pattern - Python', async () => {
        const filePaths = ['/path/to/util_test.py', '/path/to/test_util.py']
        const language = 'python'

        for (const filePath of filePaths) {
            const result = await isTestFile(filePath, { languageId: language })
            assert.strictEqual(result, true)
        }
    })

    it('should return false if the file name does not match the test filename pattern - Python', async () => {
        const filePaths = ['/path/to/util.py', '/path/to/utilTest.java', '/path/to/Testutil.java']
        const language = 'python'

        for (const filePath of filePaths) {
            const result = await isTestFile(filePath, { languageId: language })
            assert.strictEqual(result, false)
        }
    })

    it('should return false if the language is not supported', async () => {
        const filePath = '/path/to/MyClass.cpp'
        const language = 'c++'
        const result = await isTestFile(filePath, { languageId: language })
        assert.strictEqual(result, false)
    })
})
