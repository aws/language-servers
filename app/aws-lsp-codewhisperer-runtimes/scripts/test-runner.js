const spawn = require('cross-spawn')

async function runTests() {
    // Start the dev server
    const devServer = spawn('npm', ['run', 'start'], { stdio: 'inherit' })

    // Give the server a moment to start
    await new Promise(resolve => setTimeout(resolve, 2000))
    console.log('After await new Promise(reso..')
    isPortInUse(8080)
        .then(inUse => console.log(`Port in use: ${inUse}`))
        .catch(err => console.error(err))

    // Run the tests
    const testProcess = spawn('npx', ['wdio', 'run', 'wdio.conf.js'], {
        stdio: 'inherit',
        env: { ...process.env, NODE_OPTIONS: '--max_old_space_size=8172' },
    })

    // Handle cleanup for both processes
    // Handle cleanup
    const cleanup = async () => {
        console.log('Inside cleanup')
        isPortInUse(8080)
            .then(inUse => console.log(`Port in use: ${inUse}`))
            .catch(err => console.error(err))
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

async function isPortInUse(port) {
    if (process.platform === 'win32') {
        return new Promise((resolve, reject) => {
            const netstat = spawn('cmd', ['/c', 'netstat -ano | findstr :' + port], {
                shell: true,
            })

            let output = ''

            netstat.stdout.on('data', data => {
                output += data.toString()
            })

            netstat.stderr.on('data', data => {
                console.error('Error:', data.toString())
            })

            netstat.on('close', code => {
                resolve(output.length > 0)
            })

            netstat.on('error', err => {
                reject(err)
            })
        })
    }
    return false
}

runTests()
    .then(code => {
        isPortInUse(8080)
        process.exit(code)
    })
    .catch(err => {
        console.error('Test execution failed:', err)
        process.exit(1)
    })
