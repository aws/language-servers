const { spawn } = require('child_process')

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

isPortInUse(8080)
    .then(inUse => console.log(`Port in use: ${inUse}`))
    .catch(err => console.error(err))
