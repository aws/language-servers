const tsPreset = require('ts-jest/jest-preset')

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    transform: {
        ...tsPreset.transform,
        [`/src/partiql-parser-wasm/partiql_playground.js`]: require.resolve('./test-utils/esm-transformer'),
    },
    transformIgnorePatterns: [...(tsPreset.transformIgnorePatterns || [])],
    // Stop running tests after N failures
    bail: 0,

    // Automatically clear mock calls, instances and results before every test
    clearMocks: true,

    // Indicates whether the coverage information should be collected while executing the test
    collectCoverage: true,

    // The directory where Jest should output its coverage files
    coverageDirectory: 'coverage',

    // An array of regexp pattern strings used to skip coverage collection
    coveragePathIgnorePatterns: ['src/partiql-parser-wasm'],

    // Indicates which provider should be used to instrument code for coverage
    // Options are the default 'babel' or the experimental 'v8'.
    coverageProvider: 'babel',

    // A list of reporter names that Jest uses when writing coverage reports
    coverageReporters: ['json', 'text', 'lcov', 'clover'],

    // Make calling deprecated APIs throw helpful error messages
    errorOnDeprecated: true,

    // The maximum amount of workers used to run your tests. Can be specified as % or a number. E.g. maxWorkers: 10% will use 10% of your CPU amount + 1 as the maximum worker number. maxWorkers: 2 will use a maximum of 2 workers.
    maxWorkers: '60%',

    // The number of seconds after which a test is considered as slow and reported as such in the results.
    slowTestThreshold: 5,

    // The test environment that will be used for testing
    // Runs tests in 'node' mode by default, add override to top of files that need JSDOM.
    testEnvironment: 'node',

    // The glob patterns Jest uses to detect test files
    testMatch: ['**/*.test.ts?(x)'],

    // Indicates whether each individual test should be reported during the run
    verbose: false,
}
