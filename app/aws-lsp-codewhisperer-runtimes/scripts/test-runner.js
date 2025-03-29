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

    // Handle cleanup for both processes
    const cleanup = () => {
        console.log('Cleaning up processes...')
        devServer.kill()
        testProcess.kill()
        spawn('npm', ['run', 'stop-dev-server'], { stdio: 'inherit' })
    }

    // Handle main process termination signals
    process.on('SIGINT', () => {
        cleanup()
        process.exit(1)
    })

    process.on('SIGTERM', () => {
        cleanup()
        process.exit(1)
    })

    // Handle dev server unexpected exit
    devServer.on('exit', code => {
        if (code !== 0) {
            console.log(`Dev server exited unexpectedly with code ${code}`)
            testProcess.kill()
            process.exit(1)
        }
    })

    console.log('before stop-dev-server command')
    return new Promise((resolve, reject) => {
        testProcess.on('exit', code => {
            cleanup()
            resolve(code)
        })

        testProcess.on('error', err => {
            cleanup()
            reject(err)
        })
    })
}

runTests()
    .then(code => process.exit(code))
    .catch(err => {
        console.error('Test execution failed:', err)
        process.exit(1)
    })
