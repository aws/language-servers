#!/usr/bin/env ts-node

import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

interface FlareManifest {
    version: string
    ui: {
        main: string
        checksum: string
        size: number
    }
    metadata: {
        name: string
        description: string
        buildDate: string
    }
}

function generateChecksum(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath)
    return crypto.createHash('sha256').update(fileBuffer).digest('hex')
}

function generateManifest(): void {
    const mynahUiDir = path.join(__dirname, '..', 'mynah-ui')
    const distDir = path.join(mynahUiDir, 'dist')
    const mainJsPath = path.join(distDir, 'main.js')
    const packageJsonPath = path.join(mynahUiDir, 'package.json')
    const outputPath = path.join(distDir, 'manifest.json')

    if (!fs.existsSync(mainJsPath)) {
        throw new Error(`Build artifact not found: ${mainJsPath}. Please run 'npm run build' in mynah-ui first.`)
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    const stats = fs.statSync(mainJsPath)

    const manifest: FlareManifest = {
        version: packageJson.version,
        ui: {
            main: 'main.js',
            checksum: generateChecksum(mainJsPath),
            size: stats.size,
        },
        metadata: {
            name: packageJson.name,
            description: packageJson.description,
            buildDate: new Date().toISOString(),
        },
    }

    fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2))
    console.log(`✓ Flare manifest generated: ${outputPath}`)
    console.log(`  Version: ${manifest.version}`)
    console.log(`  Checksum: ${manifest.ui.checksum}`)
    console.log(`  Size: ${manifest.ui.size} bytes`)
}

try {
    generateManifest()
} catch (error) {
    console.error('Error generating manifest:', error)
    process.exit(1)
}
