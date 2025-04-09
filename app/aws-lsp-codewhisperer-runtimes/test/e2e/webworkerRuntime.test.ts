import { browser } from '@wdio/globals'
import { expect } from '@wdio/globals'

describe('Webworker testing at runtime', () => {
    before(async () => {
        const url = 'http://localhost:8080'

        // Wait for the webworker with the language server to be ready on localhost
        await browser.waitUntil(
            async () => {
                try {
                    await new Promise(resolve => setTimeout(resolve, 10000)) // wait 10 seconds between retries
                    await browser.url(url)
                    const bodyText = await $('body').getText()
                    return bodyText.includes('page hosting webworker')
                } catch (error) {
                    return false
                }
            },
            {
                timeout: 300000, // 5 minutes timeout to wait for bundle to be served on webserver on localhost
                timeoutMsg: 'Expected text "page hosting webworker" to appear, but it did not',
            }
        )
    })

    it('should have no runtime console errors', async () => {
        // even after page loads, it is safer to wait some seconds for logs to appear on console
        await new Promise(resolve => setTimeout(resolve, 10000))

        const logs = await browser.getLogs('browser')

        console.log('### START LOGS ###')
        logs.forEach(log => {
            console.log(`[WDIO ${log.level}]: ${log.message}`)
        })
        console.log('### END LOGS ###')

        const errorLogs = logs.filter(log => log.level === 'SEVERE')
        expect(errorLogs).toHaveLength(0)
    })
})
