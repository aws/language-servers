#!/usr/bin/env ts-node

/**
 * This script is used by CI to gather package.json dependencies that should be
 * included in the license attribution.
 *
 * It is a hack -- the tooling used to gather licenses is not compatible with
 * monorepo workspaces.
 *
 * As long as 'npm install' has been run, the root node_modules folder will contain
 * the dependency packages for the full workspace. We then add dependency entries
 * to the root package.json from agentic chat related workspace packages (which
 * then have a valid reference to content in node_modules).
 *
 * This script is intended to be run just prior to generate-agentic-attribution.sh.
 * It mutates package.json, but the intention is to run this in CI, and discard the mutation.
 *
 * To properly use this script, call npm run ci:generate:agentic:attribution
 */

import * as fs from 'fs'
import * as path from 'path'

interface PackageJson {
    dependencies?: Record<string, string>
    [key: string]: any
}

/**
 * The packages in this monorepo that we want to accumulate dependencies from
 */
const TARGET_PACKAGE_FILES = [
    'app/aws-lsp-codewhisperer-runtimes/package.json',
    'chat-client/package.json',
    'core/aws-lsp-core/package.json',
    'server/aws-lsp-codewhisperer/package.json',
    'server/aws-lsp-identity/package.json',
]

const ROOT_PACKAGE_JSON = './package.json'

function readPackageJson(filePath: string): PackageJson {
    try {
        const content = fs.readFileSync(filePath, 'utf8')
        return JSON.parse(content)
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error)
        throw error
    }
}

function writePackageJson(filePath: string, packageJson: PackageJson): void {
    try {
        const content = JSON.stringify(packageJson, null, 2) + '\n'
        fs.writeFileSync(filePath, content, 'utf8')
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error)
        throw error
    }
}

function gatherDependencies(): void {
    console.log('Gathering dependencies from target packages...')

    // Read root package.json
    const rootPackage = readPackageJson(ROOT_PACKAGE_JSON)

    // Ensure dependencies section exists
    if (!rootPackage.dependencies) {
        rootPackage.dependencies = {}
    }

    let addedCount = 0
    let skippedCount = 0

    // Process each target package.json file
    for (const targetFile of TARGET_PACKAGE_FILES) {
        const fullPath = path.resolve(targetFile)

        if (!fs.existsSync(fullPath)) {
            console.warn(`Warning: ${targetFile} does not exist, skipping...`)
            continue
        }

        console.log(`Processing ${targetFile}...`)
        const targetPackage = readPackageJson(fullPath)

        // Add non-duplicate entries to the root package.json dependencies from
        // the currently loaded package.json.
        if (targetPackage.dependencies) {
            for (const [depName, depVersion] of Object.entries(targetPackage.dependencies)) {
                if (rootPackage.dependencies[depName]) {
                    console.log(`  Skipping ${depName} (already exists in root)`)
                    skippedCount++
                } else {
                    console.log(`  Adding ${depName}@${depVersion}`)
                    rootPackage.dependencies[depName] = depVersion
                    addedCount++
                }
            }
        } else {
            console.log(`  No dependencies found in ${targetFile}`)
        }
    }

    // Write updated root package.json
    writePackageJson(ROOT_PACKAGE_JSON, rootPackage)

    console.log(`\nCompleted: ${addedCount} dependencies added, ${skippedCount} skipped`)
}

if (require.main === module) {
    gatherDependencies()
}
