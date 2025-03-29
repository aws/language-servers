const net = require('net')

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

isPortInUse(8080)
    .then(inUse => console.log(`Port in use: ${inUse} should not be by now (end)`))
    .catch(err => console.error(err))
