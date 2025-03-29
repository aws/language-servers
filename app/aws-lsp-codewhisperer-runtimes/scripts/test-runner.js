const spawn = require('cross-spawn')

async function runTests() {
    // Start the dev server
    const devServer = spawn('npm', ['run', 'start'], { stdio: 'inherit' })

    // Give the server a moment to start
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Run the tests
    const testProcess = spawn('npx', ['wdio', 'run', 'wdio.conf.js'], {
        stdio: 'inherit',
        env: { ...process.env, NODE_OPTIONS: '--max_old_space_size=8172' },
    })

    // Handle cleanup for both processes
    // Handle cleanup
    const cleanup = async () => {
        console.log('Cleaning up processes...')
        if (testProcess && !testProcess.killed) {
            console.log('Killing test process...')
            testProcess.kill()
        }

        // Wait for stop-dev-server to complete
        await new Promise(resolve => {
            const stopServer = spawn('node', ['dev-server.js', 'stop'], { stdio: 'inherit' })
            stopServer.on('exit', resolve)
        })
    }

    // Handle main process termination signals
    process.on('SIGINT', () => {
        cleanup().then(() => process.exit(0))
    })

    process.on('SIGTERM', () => {
        cleanup().then(() => process.exit(0))
    })

    // Handle dev server unexpected exit
    devServer.on('exit', code => {
        if (code !== 0) {
            console.log(`Dev server exited unexpectedly with code ${code}`)
            cleanup().then(() => process.exit(1))
        }
    })

    return new Promise((resolve, reject) => {
        testProcess.on('exit', code => {
            cleanup().then(() => {
                if (code !== 0) {
                    console.log(`Test process exited with code ${code}`)
                }
                resolve(code)
            })
        })

        testProcess.on('error', err => {
            console.error('Test process error:', err)
            cleanup().then(() => reject(err))
        })
    })
}

runTests()
    .then(code => {
        process.exit(code)
    })
    .catch(err => {
        console.error('Test execution failed:', err)
        process.exit(1)
    })
