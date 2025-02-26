import { BaseDependencyInfo, Dependency, LanguageDependencyHandler } from './LanguageDependencyHandler'
import * as path from 'path'
import * as fs from 'fs'

export interface PythonDependencyInfo extends BaseDependencyInfo {
    vscCodeSettingsJsonPath: string
}

export class PythonDependencyHandler extends LanguageDependencyHandler<PythonDependencyInfo> {
    private pythonDependencyInfos: PythonDependencyInfo[] = []

    discover(currentDir: string): boolean {
        let result: PythonDependencyInfo | null = null
        const vscCodeSettingsJsonPath = path.join(currentDir, '.vscode', 'settings.json')
        if (fs.existsSync(vscCodeSettingsJsonPath) && fs.statSync(vscCodeSettingsJsonPath).isFile()) {
            console.log(`Found .vscode/settings.json in ${currentDir}`)
            result = { pkgDir: currentDir, vscCodeSettingsJsonPath: vscCodeSettingsJsonPath }
            this.pythonDependencyInfos.push(result)
        }
        return result !== null
    }

    createDependencyMap(): Map<string, Dependency> {
        const dependencyMap = new Map<string, Dependency>()

        if (this.pythonDependencyInfos.length === 0) {
            return dependencyMap
        }

        this.pythonDependencyInfos.forEach(pythonDependencyInfo => {
            try {
                const settingsPath = pythonDependencyInfo.vscCodeSettingsJsonPath
                const settingsContent = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))

                // Get the workspace folder path for variable substitution
                const workspaceFolder = path.dirname(path.dirname(settingsPath))

                // Get and resolve paths from both settings
                const analysisPaths = (settingsContent['python.analysis.extraPaths'] || []).map((rawPath: string) =>
                    this.resolvePath(rawPath, workspaceFolder)
                )

                const autoCompletePaths = (settingsContent['python.autoComplete.extraPaths'] || []).map(
                    (rawPath: string) => this.resolvePath(rawPath, workspaceFolder)
                )

                // Find all unique site-packages directories
                const sitePackagesPaths = this.findSitePackagesPaths([...analysisPaths, ...autoCompletePaths])

                if (sitePackagesPaths.length === 0) {
                    this.logging.log('No site-packages directories found in Python paths')
                    return dependencyMap
                }

                // Log found site-packages directories
                this.logging.log('Found site-packages directories:')
                sitePackagesPaths.forEach(path => this.logging.log(` - ${path}`))

                // Process each site-packages directory
                for (const sitePackagesPath of sitePackagesPaths) {
                    const sitePackagesContent = fs.readdirSync(sitePackagesPath)

                    for (const item of sitePackagesContent) {
                        const itemPath = path.join(sitePackagesPath, item)

                        // Skip if not a directory or if it's a metadata directory
                        if (
                            !fs.statSync(itemPath).isDirectory() ||
                            item.endsWith('.egg-info') ||
                            item.endsWith('.dist-info') ||
                            item.endsWith('-info')
                        ) {
                            continue
                        }

                        // Add to dependency map if not already present
                        if (!dependencyMap.has(item)) {
                            dependencyMap.set(item, {
                                name: item,
                                version: 'unknown',
                                path: itemPath,
                            })
                        }
                    }
                }

                // Log found dependencies
                this.logging.log(
                    `Total python dependencies found: ${dependencyMap.size} under ${pythonDependencyInfo.pkgDir}`
                )
            } catch (error) {
                this.logging.log(`Error processing Python dependencies: ${error}`)
            }
        })

        return dependencyMap
    }

    private resolvePath(rawPath: string, workspaceFolder: string): string {
        // Handle common VS Code variables
        return rawPath
            .replace(/\${workspaceFolder}/g, workspaceFolder)
            .replace(/\${env:([^}]+)}/g, (_, envVar) => process.env[envVar] || '')
            .replace(/\${userHome}/g, process.env.HOME || process.env.USERPROFILE || '')
    }

    private findSitePackagesPaths(pythonPaths: string[]): string[] {
        // Normalize paths and remove duplicates
        const normalizedPaths = new Set(
            pythonPaths.map(p => path.normalize(p)).filter(p => p.includes('site-packages') && fs.existsSync(p))
        )

        return Array.from(normalizedPaths)
    }
}
