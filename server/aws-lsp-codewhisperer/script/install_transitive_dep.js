// This script is required because transitive dependencies of bundled dependencies are not getting packed or installed.

/* eslint-disable import/no-nodejs-modules */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const packageJson = JSON.parse(fs.readFileSync('package.json').toString())
const bundleDependencies = packageJson.bundleDependencies || []

for (let dependency of bundleDependencies) {
    const dependencyPath = path.join('node_modules', dependency)

    // Check if the dependency exists in node_modules to avoid monorepo setup
    if (fs.existsSync(dependencyPath)) {
        console.log(`Bundled dependency '${dependency}' found. Installing its dependencies...`)
        try {
            process.chdir(dependencyPath)
            const npmInstallCommand = process.platform === 'win32' ? 'npm.cmd install' : 'npm install'
            execSync(npmInstallCommand, { stdio: 'inherit' })
            process.chdir(path.resolve(__dirname, '..'))
        } catch (error) {
            console.error(`Error installing dependencies for ${dependency}: ${error}`)
        }
    } else {
        console.log(`Dependency '${dependency}' not found.`)
    }
}
