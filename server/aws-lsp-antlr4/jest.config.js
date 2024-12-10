const tsPreset = require('ts-jest/jest-preset')

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    ...tsPreset,

    // The test environment that will be used for testing
    testEnvironment: 'node',

    // The glob patterns Jest uses to detect test files
    testMatch: ['**/*.test.ts?(x)'],
}
