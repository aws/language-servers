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

// Function to copy directory recursively, resolving symlinks
function copyDir(src: string, dest: string) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true })
    }
    fs.readdirSync(src).forEach(file => {
        const srcFile = path.join(src, file)
        const destFile = path.join(dest, file)
        const resolvedSrcFile = fs.realpathSync(srcFile)

        if (fs.lstatSync(resolvedSrcFile).isDirectory()) {
            copyDir(resolvedSrcFile, destFile)
        } else {
            fs.copyFileSync(resolvedSrcFile, destFile)
        }
    })
}

// Loop through each bundleDependency
for (const dependency of bundleDependencies) {
    const dependencyPath = path.join(rootDir, 'node_modules', dependency)

    // Check if the dependency exists in the root node_modules directory
    if (fs.existsSync(dependencyPath)) {
        // Resolve any symlinks to get the real path
        const resolvedDependencyPath = fs.realpathSync(dependencyPath)

        // Determine the target location within the package
        const targetLocation = path.join('node_modules', dependency)

        try {
            // Clear contents or remove the last folder in the path
            if (fs.existsSync(targetLocation)) {
                fs.rmSync(targetLocation, { recursive: true, force: true })
            }
            // Copy the dependency from the resolved path
            copyDir(resolvedDependencyPath, targetLocation)
            console.log(`Copied ${dependency} from ${resolvedDependencyPath}`)
        } catch (err) {
            console.error(`ERROR: Failed to copy ${dependency} from ${resolvedDependencyPath}. ${err}`)
            process.exit(1)
        }
    } else {
        console.error(`ERROR: ${dependency} not found in the root node_modules directory.`)
        process.exit(1)
    }
}
