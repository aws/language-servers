async function isPortInUse(port) {
    if (process.platform === 'win32') {
        try {
            console.log('Inside win32')
            const { stdout } = await exec(`netstat -ano | findstr :${port}`)
            return stdout.length > 0
        } catch (err) {
            console.log(err)
            return false
        }
    }
    return false
}

isPortInUse(8080)
