const spawn = require('cross-spawn')
const net = require('net')

async function runTests() {
    // Start the dev server
    const devServer = spawn('npm', ['run', 'start'], { stdio: 'inherit' })

    // Give the server a moment to start
    await new Promise(resolve => setTimeout(resolve, 2000))
    console.log('After await new Promise(reso..')
    isPortInUse(8080)
        .then(inUse => console.log(`Port in use: ${inUse} should be used after calling start script`))
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
            .then(inUse => console.log(`Port in use: ${inUse} inside cleanup should be used`))
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
    return new Promise(resolve => {
        const server = net.createServer()

        server.once('error', err => {
            if (err.code === 'EADDRINUSE') {
                console.log(`Port ${port} is in use.`)
                resolve(true) // Port is in use
            } else {
                console.error('Error checking port:', err)
                resolve(false) // Some other error
            }
        })

        server.once('listening', () => {
            server.close()
            resolve(false) // Port is not in use
        })

        server.listen(port)
    })
}

runTests()
    .then(code => {
        isPortInUse(8080)
            .then(inUse => console.log(`Port in use: ${inUse} should not be by now (runTests closure)`))
            .catch(err => console.error(err))

        process.exit(code)
    })
    .catch(err => {
        console.error('Test execution failed:', err)
        process.exit(1)
    })
