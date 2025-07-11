import * as fsPromises from 'fs/promises'
import * as path from 'path'
import { exec } from 'child_process'

// This script takes node distributions downloaded by scripts/download-node.sh
// and places the necessary files in locations for bundling into servers.zip.
// node application files are extracted from tgz files in build/node-assets
// into build/private/assets/(platform)-(architecture)/

// Ensure directory exists
async function ensureDirectory(dirPath: string): Promise<void> {
    try {
        await fsPromises.access(dirPath)
    } catch {
        await fsPromises.mkdir(dirPath, { recursive: true })
    }
}

// Copy directory recursively
async function copyDirectory(src: string, dest: string): Promise<void> {
    await ensureDirectory(dest)
    const entries = await fsPromises.readdir(src, { withFileTypes: true })

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name)
        const destPath = path.join(dest, entry.name)

        if (entry.isDirectory()) {
            await copyDirectory(srcPath, destPath)
        } else {
            await fsPromises.copyFile(srcPath, destPath)
        }
    }
}

async function copyWindowsAssets() {
    const sourceDir = 'build/node-assets/win-x64'
    const destDir = 'build/private/assets/win-x64'
    await ensureDirectory(path.dirname(destDir))
    await copyDirectory(sourceDir, destDir)
}

async function copyLinuxAndMacAssets() {
    const overridesContent = await fsPromises.readFile('../../attribution/overrides.json', 'utf8')
    const version = JSON.parse(overridesContent).node.version
    const nodeAssetsRoot = 'build/node-assets'
    const linuxX64 = `node-v${version}-linux-x64`
    const macX64 = `node-v${version}-darwin-x64`
    const linuxArm64 = `node-v${version}-linux-arm64`
    const macArm64 = `node-v${version}-darwin-arm64`

    await run(`cd ${nodeAssetsRoot} && tar -xzf ${linuxX64}.tar.gz --strip-components=2 ${linuxX64}/bin/node`)
    await ensureDirectory('build/private/assets/linux-x64')
    await fsPromises.rename(`${nodeAssetsRoot}/node`, 'build/private/assets/linux-x64/node')

    await run(`cd ${nodeAssetsRoot} && tar -xzf ${macX64}.tar.gz --strip-components=2 ${macX64}/bin/node`)
    await ensureDirectory('build/private/assets/mac-x64')
    await fsPromises.rename(`${nodeAssetsRoot}/node`, 'build/private/assets/mac-x64/node')

    await run(`cd ${nodeAssetsRoot} && tar -xzf ${linuxArm64}.tar.gz --strip-components=2 ${linuxArm64}/bin/node`)
    await ensureDirectory('build/private/assets/linux-arm64')
    await fsPromises.rename(`${nodeAssetsRoot}/node`, 'build/private/assets/linux-arm64/node')

    await run(`cd ${nodeAssetsRoot} && tar -xzf ${macArm64}.tar.gz --strip-components=2 ${macArm64}/bin/node`)
    await ensureDirectory('build/private/assets/mac-arm64')
    await fsPromises.rename(`${nodeAssetsRoot}/node`, 'build/private/assets/mac-arm64/node')
}

function run(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(command, (error: any, stdout: string, stderr: string) => {
            if (error) {
                reject(error)
            } else {
                resolve(stdout.trim())
            }
        })
    })
}

;(async () => {
    await copyWindowsAssets()
    await copyLinuxAndMacAssets()
})()
