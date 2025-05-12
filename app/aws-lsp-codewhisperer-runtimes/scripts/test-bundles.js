const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

function testBundle(bundlePath) {
    return new Promise((resolve, reject) => {
        console.info(`Testing ${bundlePath}...`)
        let startupTimeout

        const serverProcess = spawn('node', [bundlePath, '--stdio'], {
            stdio: 'pipe',
            shell: true,
        })

        serverProcess.on('error', error => {
            clearTimeout(startupTimeout)
            console.error(`Error starting server process: ${error}`)
            reject(error)
        })

        serverProcess.on('exit', code => {
            clearTimeout(startupTimeout)
            console.info(`Server process exited with code: ${code}`)
            if (code === 0) {
                resolve()
            } else {
                reject(new Error(`Test failed with exit code ${code}`))
            }
        })

        serverProcess.on('spawn', () => {
            console.info('Spawn called')
            // Wait for 10s, then close the process in case something taking long time to process, which might cause an error
            startupTimeout = setTimeout(() => {
                if (process.platform === 'win32') {
                    spawn('taskkill', ['/pid', serverProcess.pid, '/f', '/t'])
                } else {
                    serverProcess.kill()
                }
                resolve()
            }, 10000)
        })
    })
}

async function testAllBundles() {
    const buildDir = path.join(__dirname, '../build')
    const bundleFiles = fs.readdirSync(buildDir).filter(file => file.endsWith('.js'))

    for (const file of bundleFiles) {
        try {
            await testBundle(path.join(buildDir, file))
            console.info(`✓ ${file} test passed`)
        } catch (error) {
            console.error(`✗ ${file} test failed:`, error)
            process.exit(1)
        }
    }
}

testAllBundles().catch(error => {
    console.error('Bundle testing failed:', error)
    process.exit(1)
})
