import { promises as fs } from 'fs'
import { resolve } from 'path'

async function copyFile(source: string, destination: string) {
    try {
        await fs.copyFile(source, destination)
        // console.log(`File copied from ${source} to ${destination}`)
    } catch (error) {
        console.error('Error copying file:', error)
    }
}

async function main() {
    const filesToCopy = ['tree-sitter-web.d.ts', 'tree-sitter.js', 'tree-sitter.wasm']

    const sourceDir = './node_modules/web-tree-sitter'
    const destinationDir = './out'

    for (const fileName of filesToCopy) {
        const sourcePath = resolve(sourceDir, fileName)
        const destinationPath = resolve(destinationDir, fileName)
        await copyFile(sourcePath, destinationPath)
    }
}

main()
