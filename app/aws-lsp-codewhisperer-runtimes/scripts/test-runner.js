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
    const cleanup = () => {
        console.log('Cleaning up processes...')
        if (devServer && !devServer.killed) {
            console.log('Killing dev server...')
            devServer.kill()
        }
        if (testProcess && !testProcess.killed) {
            console.log('Killing test process...')
            testProcess.kill()
        }
        spawn('node', ['scripts/dev-server.js', 'stop'], {
            stdio: 'inherit',
        })
        console.log('Clenaup complete')
    }

    // Handle main process termination signals
    process.on('SIGINT', () => {
        cleanup()
        process.exit(0) // Clean shutdown, exit with 0
    })

    process.on('SIGTERM', () => {
        cleanup()
        process.exit(0) // Clean shutdown, exit with 0
    })

    // Handle dev server unexpected exit
    devServer.on('exit', code => {
        if (code !== 0) {
            console.log(`Dev server exited unexpectedly with code ${code}`)
            testProcess.kill()
            process.exit(1) // Server error, exit with 1
        }
    })

    console.log('before stop-dev-server command')
    return new Promise((resolve, reject) => {
        testProcess.on('exit', code => {
            cleanup()
            if (code !== 0) {
                console.log(`Test process exited with code ${code}`)
            }
            resolve(code) // Pass through the actual exit code
        })

        testProcess.on('error', err => {
            console.error('Test process error:', err)
            cleanup()
            reject(err) // This will be caught by the catch block and exit with 1
        })
    })
}

runTests()
    .then(code => {
        process.exit(code) // Exit with the test process exit code
    })
    .catch(err => {
        console.error('Test execution failed:', err)
        process.exit(1) // Error condition, exit with 1
    })
