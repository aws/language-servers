/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert'
import { TestIntentDetector } from './unitTestIntentDetection'

describe('TestIntentDetector', function () {
    let sut: TestIntentDetector

    beforeEach(() => {
        sut = new TestIntentDetector()
    })

    describe('isTestFile', function () {
        it('should throw if language is not in the supported language set', function () {
            const testCases = ['kotlin', 'vuejs', 'plaintext', 'markdown', 'c', 'cpp', 'foo', 'bar', 'unknown']

            for (const testCase of testCases) {
                assert.throws(() => sut.isTestFile('foo', '', testCase), /lang not supported by utg completion/)
            }
        })

        describe('should return false if file name doesnt follow test file naming convention', function () {
            const testCases: { filepath: string; content: string; language: string }[] = [
                {
                    filepath: 'foo.java',
                    content: '',
                    language: 'java',
                },
                {
                    filepath: 'foo.java',
                    content: `
                        @Test
                        public void case1(
                    `,
                    language: 'java',
                },
                {
                    filepath: 'main.py',
                    content: `
                        @Test
                        def case1(
                    `,
                    language: 'python',
                },
                {
                    filepath: 'aTypeScriptClass.ts',
                    content: `describe(class1, function (`,
                    language: 'typescript',
                },
                {
                    filepath: 'someJavascriptUtil.js',
                    content: 'export function helper',
                    language: 'javascript',
                },
            ]

            for (let i = 0; i < testCases.length; i++) {
                const testCase = testCases[i]
                it(`case ${i}`, function () {
                    const actual = sut.isTestFile(testCase.filepath, testCase.content, testCase.language)
                    assert.strictEqual(actual, false)
                })
            }
        })

        describe('should return false if filename follows test naming convertion BUT content doesnt contain unit test keywords', function () {
            const testCases: { filepath: string; language: string; content: string }[] = [
                {
                    filepath: 'fooTest.java',
                    language: 'java',
                    content: ``,
                },
                {
                    filepath: 'FooTests.java',
                    language: 'java',
                    content: ``,
                },
                {
                    filepath: 'TestFoo.java',
                    language: 'java',
                    content: ``,
                },
                {
                    filepath: 'TestsFoo.java',
                    language: 'java',
                    content: ``,
                },
                {
                    filepath: 'foo_class_test.py',
                    language: 'python',
                    content: ``,
                },
                {
                    filepath: 'test_foo_class.py',
                    language: 'python',
                    content: ``,
                },
                {
                    filepath: 'aTypeScriptClass.test.ts',
                    language: 'typescript',
                    content: ``,
                },
                {
                    filepath: 'aTypeScriptClass.spec.ts',
                    language: 'typescript',
                    content: ``,
                },
                {
                    filepath: 'someJavascriptUtil.test.js',
                    language: 'javascript',
                    content: '',
                },
                {
                    filepath: 'someJavascriptUtil.spec.js',
                    language: 'javascript',
                    content: '',
                },
            ]

            for (let i = 0; i < testCases.length; i++) {
                const testCase = testCases[i]
                it(`case ${i}`, function () {
                    const actual = sut.isTestFile(testCase.filepath, testCase.content, testCase.language)
                    assert.strictEqual(actual, false)
                })
            }
        })

        describe('should return true if filename follows test naming convention AND content contains unit test keywords', function () {
            const testCases: { filepath: string; language: string; content: string }[] = [
                {
                    filepath: 'fooTest.java',
                    language: 'java',
                    content: `
@Test
public void
                    `,
                },
                {
                    filepath: 'FooTests.java',
                    language: 'java',
                    content: `
@Test
public void
                    `,
                },
                {
                    filepath: 'TestFoo.java',
                    language: 'java',
                    content: `
@Test
public void
                    `,
                },
                {
                    filepath: 'foo_class_test.py',
                    language: 'python',
                    content: `import unittest`,
                },
                {
                    filepath: 'test_foo_class.py',
                    language: 'python',
                    content: `def test_foo`,
                },
                {
                    filepath: 'aTypeScriptClass.test.ts',
                    language: 'typescript',
                    content: `describe(`,
                },
                {
                    filepath: 'aTypeScriptClass.spec.ts',
                    language: 'typescript',
                    content: `describe(`,
                },
                {
                    filepath: 'someJavascriptUtil.test.js',
                    language: 'javascript',
                    content: 'it(function (',
                },
                {
                    filepath: 'someJavascriptUtil.spec.js',
                    language: 'javascript',
                    content: 'it(function (',
                },
            ]

            for (let i = 0; i < testCases.length; i++) {
                const testCase = testCases[i]
                it(`case ${i}`, function () {
                    const actual = sut.isTestFile(testCase.filepath, testCase.content, testCase.language)
                    assert.strictEqual(actual, true)
                })
            }
        })
    })

    describe('javaTestIntent', function () {
        describe('should return true if content is in the middle of a test case', function () {
            const testCases = [
                `
import org.junit.jupiter.api.Test;

public class ExampleTest {
	@Test
	public void testSomething() {`,
            ]

            for (let i = 0; i < testCases.length; i++) {
                const testCase = testCases[i]
                it(`case ${i}`, function () {
                    const actual = sut.javaTestIntent(testCase)
                    assert.strictEqual(actual, true)
                })
            }
        })

        describe('should return false if content is not in the middle of a test case', function () {
            const testCases = [
                `import org.junit.jupiter.api.Test;`,
                `
public class ExampleTest {
    @Test
    public void testSomething() {
        assertThat(1).isEqualTo(1);
    }
}`,
            ]

            for (let i = 0; i < testCases.length; i++) {
                const testCase = testCases[i]
                it(`case ${i}`, function () {
                    const actual = sut.javaTestIntent(testCase)
                    assert.strictEqual(actual, false)
                })
            }
        })
    })

    describe('jsTsTestIntent', function () {
        describe('should return true if content is in the middle of a test case', function () {
            const testCases = [
                `
describe('feature', () => {
  it('should work', () => {`,
                `describe('feature', () => {
  test('runs correctly', async () => {`,
            ]

            for (let i = 0; i < testCases.length; i++) {
                const testCase = testCases[i]
                it(`case ${i}`, function () {
                    const actual = sut.jsTsTestIntent(testCase)
                    assert.strictEqual(actual, true)
                })
            }
        })

        describe('should return false if content is not in the middle of a test case', function () {
            const testCases = [
                `describe('math', () => {
  it('adds correctly', () => {
    expect(1 + 2).toBe(3);
  });
});`,
                `describe('some module', () => {
  beforeEach(() => {
    // setup code`,
            ]

            for (let i = 0; i < testCases.length; i++) {
                const testCase = testCases[i]
                it(`case ${i}`, function () {
                    const actual = sut.jsTsTestIntent(testCase)
                    assert.strictEqual(actual, false)
                })
            }
        })
    })

    describe('pyTestIntent', function () {
        describe('should return true if content is in the middle of a test case', function () {
            const testCases = [
                `import unittest

class TestExample(unittest.TestCase):
	def test_addition(self):
`,
            ]

            for (let i = 0; i < testCases.length; i++) {
                const testCase = testCases[i]
                it(`case ${i}`, function () {
                    const actual = sut.pyTestIntent(testCase)
                    assert.strictEqual(actual, true)
                })
            }
        })

        describe('should return false if content is not in the middle of a test case', function () {
            const testCases = [
                `import unittest

def helper():
    return 42
`,
            ]

            for (let i = 0; i < testCases.length; i++) {
                const testCase = testCases[i]
                it(`case ${i}`, function () {
                    const actual = sut.pyTestIntent(testCase)
                    assert.strictEqual(actual, false)
                })
            }
        })
    })

    // TODO:
    describe('detectUnitTestIntent', function () {})
})
