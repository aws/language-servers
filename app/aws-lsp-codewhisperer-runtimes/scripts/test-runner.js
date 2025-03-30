const spawn = require('cross-spawn')

async function runTests() {
    // Start the dev server
    spawn('npm', ['run', 'start'], { stdio: 'inherit' })

    // Give the server a moment to start
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Run the tests
    const testProcess = spawn('npx', ['wdio', 'run', 'wdio.conf.js'], {
        stdio: 'inherit',
        env: { ...process.env, NODE_OPTIONS: '--max_old_space_size=8172' },
    })

    return new Promise(resolve => {
        let stopServerCalled = false

        const stopServer = () => {
            if (!stopServerCalled) {
                stopServerCalled = true
                spawn('npm', ['run', 'stop-dev-server'], { stdio: 'inherit' })
            }
        }

        testProcess.on('exit', async code => {
            console.log(`Test process exited with code ${code}`)
            stopServer()
            resolve(code)
        })

        testProcess.on('close', async code => {
            console.log(`Test process closed with code ${code}`)
            stopServer()
            resolve(code)
        })

        testProcess.on('error', err => {
            console.error('Test process encountered an error:', err)
            stopServer()
            resolve(1)
        })

        setTimeout(() => {
            // Stop the dev server after killing the test process
            stopServer()
        }, 240000) // 240 seconds
    })
}

runTests().then(code => process.exit(code))
