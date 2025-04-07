const spawn = require('cross-spawn')
const fs = require('fs')
const path = require('path')

const PID_FILE = path.join(__dirname, 'dev-server.pid')
const serverPort = 8080

function startDevServer() {
    if (fs.existsSync(PID_FILE)) {
        console.log(
            'Server is already running (found temporary file dev-server.pid with server process id). Use `npm run stop` to stop it.'
        )
        return
    }

    try {
        const serverProcess = spawn('npx', ['webpack', 'serve'], {
            stdio: 'inherit',
            shell: true,
        })

        console.log(`Dev server started on port ${serverPort} (PID: ${serverProcess.pid})`)

        fs.writeFileSync(PID_FILE, serverProcess.pid.toString())

        serverProcess.on('error', err => {
            console.error('Failed to start server:', err)
            if (fs.existsSync(PID_FILE)) {
                fs.unlinkSync(PID_FILE)
            }
        })

        serverProcess.on('exit', code => {
            if (fs.existsSync(PID_FILE)) {
                fs.unlinkSync(PID_FILE)
            }
            if (code !== 0) {
                console.log(`Server process exited with code ${code}`)
            }
        })
    } catch (error) {
        console.error('Failed to spawn server process:', error)
        if (fs.existsSync(PID_FILE)) {
            fs.unlinkSync(PID_FILE)
        }
    }
}

function stopDevServer() {
    if (!fs.existsSync(PID_FILE)) {
        console.log('No running server found.')
        return
    }

    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8'), 10)

    if (isNaN(pid)) {
        console.error('Invalid PID file. Deleting it.')
        fs.unlinkSync(PID_FILE)
        return
    }

    console.log(`Stopping dev server (PID: ${pid})...`)

    if (process.platform === 'win32') {
        spawn('taskkill', ['/PID', pid], {
            stdio: 'inherit',
            shell: true,
        }).on('exit', code => {
            if (code === 0) {
                console.log('Dev server stopped.')
                fs.unlinkSync(PID_FILE)
            } else {
                console.error(`Error stopping server: exit code ${code}`)
            }
        })
    } else {
        try {
            process.kill(pid)
            console.log('Dev server stopped.')
            fs.unlinkSync(PID_FILE)
        } catch (error) {
            console.error(`Failed to stop server: ${error.message}`)
        }
    }
}

// CLI handling
const command = process.argv[2]
if (command === 'start') {
    startDevServer()
} else if (command === 'stop') {
    stopDevServer()
} else {
    console.log('Usage: node scripts/dev-server.js [start|stop]')
}
