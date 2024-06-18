import * as fs from 'fs'
import * as path from 'path'

const rootDir = path.join(__dirname, '..')
const targetPackageDir = process.cwd()

if (!fs.existsSync(path.join(targetPackageDir, 'package.json'))) {
    console.error(`package.json not found in the ${targetPackageDir} directory.`)
    process.exit(1)
}

// Get the bundleDependencies array from package.json
const packageJson = JSON.parse(fs.readFileSync('package.json').toString())
const bundleDependencies = packageJson.bundleDependencies || []

if (bundleDependencies.length === 0) {
    console.log('No bundleDependencies found in package.json.')
    process.exit(0)
}

// Loop through each bundleDependency
for (const dependency of bundleDependencies) {
    const dependencyPath = path.join(rootDir, 'node_modules', dependency)

    // Check if the dependency exists in the root node_modules directory
    if (fs.existsSync(dependencyPath)) {
        // Create a symlink for the dependency
        const linkLocation = path.join('node_modules', dependency)
        const linkTarget = fs.realpathSync(dependencyPath)

        try {
            // Create the directory if it doesn't exist
            fs.mkdirSync(path.dirname(linkLocation), { recursive: true })

            // Clear contents or remove the last folder in the path
            if (fs.existsSync(linkLocation)) {
                fs.rmSync(linkLocation, { recursive: true, force: true })
            }
            // Create the symlink
            fs.symlinkSync(linkTarget, linkLocation, 'junction')
            console.log(`Symlink created for ${dependency}`)
        } catch (err) {
            console.error(`ERROR: Failed to create symlink for ${dependency}. ${err}`)
            process.exit(1)
        }
    } else {
        console.error(`ERROR: ${dependency} not found in the root node_modules directory.`)
        process.exit(1)
    }
}
