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
                return true
            }
            return false
        }

        testProcess.on('exit', async code => {
            console.log(`Test process exited with code ${code}`)
            if (stopServer()) {
                console.log('Stopping devserver on exit..')
            }
            resolve(code)
        })

        testProcess.on('close', async code => {
            console.log(`Test process closed with code ${code}`)
            if (stopServer()) {
                console.log('Stopping devserver on close..')
            }
            resolve(code)
        })

        testProcess.on('error', err => {
            console.error('Test process encountered an error:', err)
            if (stopServer()) {
                console.log('Stopping devserver on error..')
            }
            resolve(1)
        })

        setTimeout(() => {
            if (stopServer()) {
                console.log('Stopping devserver on timeout..')
            }
        }, 240000) // 240 seconds
    })
}
if (process.platform !== 'win32') {
    runTests().then(code => process.exit(code))
} else {
    console.log(
        'Webworker browser runtime tests are currently enabled only for unix, with windows OS they are disabled as we currently face issues with automatically shutting down devserver and cleaning resources after tests are executed.'
    )
}
