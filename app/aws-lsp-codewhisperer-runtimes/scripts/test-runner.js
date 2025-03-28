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
        testProcess.on('exit', async code => {
            // Stop the dev server
            spawn('npm', ['run', 'stop-dev-server'], { stdio: 'inherit' })
            resolve(code)
        })
    })
}

runTests().then(code => process.exit(code))
