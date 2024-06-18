/* eslint-disable import/no-nodejs-modules */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const packageJson = JSON.parse(fs.readFileSync('package.json').toString())
const bundleDependencies = packageJson.bundleDependencies || []

console.log(bundleDependencies)
for (let dependency of bundleDependencies) {
    const dependencyPath = path.join('node_modules', dependency)

    // Check if the dependency exists in node_modules
    if (fs.existsSync(dependencyPath)) {
        console.log(`Bundled dependency '${dependency}' found. Installing its dependencies...`)
        try {
            process.chdir(dependencyPath)
            console.log(dependencyPath)
            console.log(process.cwd())
            const npmInstallCommand = process.platform === 'win32' ? 'npm.cmd install' : 'npm install'
            execSync(npmInstallCommand, { stdio: 'inherit' })
            process.chdir(__dirname)
            console.log(process.cwd())
        } catch (error) {
            console.error(`Error installing dependencies for ${dependency}: ${error}`)
        }
    } else {
        console.log(`Dependency '${dependency}' not found.`)
    }
}
