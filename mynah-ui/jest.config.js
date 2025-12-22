const jestConfig = {
    testEnvironment: 'jsdom',
    preset: 'ts-jest',
    modulePathIgnorePatterns: ['<rootDir>/ui-tests/', '<rootDir>/dist/'],
    moduleNameMapper: {
        '\\.svg$': 'jest-svg-transformer',
        '^.+\\.(css|less|scss)$': 'babel-jest',
    },
    setupFiles: ['<rootDir>/test-config/config.js', 'core-js'], // Polyfill things like structuredClone
    globals: {
        'ts-jest': {
            tsconfig: '<rootDir>/tsconfig.test.json',
        },
    },
}

module.exports = jestConfig
