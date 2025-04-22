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
        const errorLogs = logs.filter(log => log.level === 'SEVERE')

        // Only log error entries if any exist
        if (errorLogs.length > 0) {
            console.log('### ERROR LOGS ###')
            errorLogs.forEach(log => {
                console.log(`[WDIO ${log.level}]: ${log.message}`)
            })
            console.log('### END ERROR LOGS ###')
        }

        expect(errorLogs).toHaveLength(0)
    })

    it('should contain server initialization log message', async () => {
        await browser.url('http://localhost:8080')
        // even after page loads, it is safer to wait some seconds for logs to appear on console
        await new Promise(resolve => setTimeout(resolve, 10000))
        // Get browser logs
        const logs = await browser.getLogs('browser')
        // Look for the specific server initialization message
        const serverInitLogs = logs.filter(log => {
            return log.message.includes('Server initialized:') && log.message.includes('Object')
        })

        // Log the matching entries for debugging
        console.log('### SERVER INIT LOGS ###')
        serverInitLogs.forEach(log => {
            console.log(`[WDIO ${log.level}]: ${log.message}`)
        })
        console.log('### END SERVER INIT LOGS ###')

        // Assert that we found at least one matching log entry
        expect(serverInitLogs.length).toBeGreaterThan(0, 'Expected to find server initialization log message')
    })
})
