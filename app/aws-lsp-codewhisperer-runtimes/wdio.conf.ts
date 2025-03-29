export const config = {
    specs: ['./test/e2e/**/*.ts'],
    maxInstances: 2,
    capabilities: [
        {
            browserName: 'chrome',
            'goog:loggingPrefs': {
                browser: 'ALL', // Capture all console logs
                driver: 'ALL',
                performance: 'ALL',
            },
            webSocketUrl: true,
            'goog:chromeOptions': {
                args: ['--headless', '--disable-gpu', '--no-sandbox', '--disable-infobars', '--disable-notifications'],
            },
        },
    ],
    logLevel: 'silent',
    baseUrl: 'http://localhost:8080',
    waitforTimeout: 300000,
    connectionRetryTimeout: 300000,
    connectionRetryCount: 1,
    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 300000,
    },
}
