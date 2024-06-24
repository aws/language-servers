// build-scripts/create-node-file.mts

import { promises as fs } from 'fs'
import * as path from 'path'

async function copyNodeFile() {
    const sourcePath = path.join(process.cwd(), 'src', 'server', 'syntax-highlighting', 'tree-sitter-partiql.wasm')
    const targetPath = path.join(process.cwd(), 'out', 'server', 'syntax-highlighting', 'tree-sitter-partiql.wasm')
    const targetDir = path.dirname(targetPath)

    try {
        // If the directory already existed, skip this step. If not, create the nested target directories
        await fs.mkdir(targetDir, { recursive: true })
        // copy the .node file
        await fs.copyFile(sourcePath, targetPath)
    } catch (error) {
        console.error('Error copying the node file:', error)
    }
}

copyNodeFile()
