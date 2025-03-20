import * as assert from 'assert'
import { isCodeFile } from './filetype'

describe('isCodeFile', () => {
    it('returns true for code files', function () {
        const codeFiles = [
            'test.py',
            'test.js',
            'Dockerfile',
            'gradlew',
            'mvnw',
            'build.gradle',
            'gradle/wrapper/gradle-wrapper.properties',
        ]
        for (const codeFilePath of codeFiles) {
            assert.strictEqual(isCodeFile(codeFilePath), true)
        }
    })

    it('returns false for other files', function () {
        const codeFiles = ['compiled.exe', 'random_file']
        for (const filePath of codeFiles) {
            assert.strictEqual(isCodeFile(filePath), false)
        }
    })
})
