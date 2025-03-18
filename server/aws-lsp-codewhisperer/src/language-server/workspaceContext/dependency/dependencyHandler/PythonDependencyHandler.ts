import { BaseDependencyInfo, Dependency, LanguageDependencyHandler } from './LanguageDependencyHandler'
import { WorkspaceFolder } from '@aws/language-server-runtimes/server-interface'
import * as path from 'path'
import * as fs from 'fs'
import { FileMetadata } from '../../artifactManager'
import { isDirectory } from '../../util'

export interface PythonDependencyInfo extends BaseDependencyInfo {
    vscCodeSettingsJsonPath: string
    sitePackagesPaths: string[]
}

/*
 * Python Dependency Handler
 *
 * This handler depends on .vscode/settings.json to discover dependency locations
 */
export class PythonDependencyHandler extends LanguageDependencyHandler<PythonDependencyInfo> {
    private pythonDependencyInfos: PythonDependencyInfo[] = []

    /**
     * It will return a boolean indicating whether it finds any dependency info.
     * The PythonDependencyInfo object contains the following properties:
     * - pkgDir: the package directory
     * - vscCodeSettingsJsonPath: the path to the .vscode/settings.json file
     * - sitePackagesPaths: the path to site-packages directory
     */
    discover(currentDir: string, workspaceFolder: WorkspaceFolder): boolean {
        let result: PythonDependencyInfo | null = null
        const vscCodeSettingsJsonPath = path.join(currentDir, '.vscode', 'settings.json')
        if (fs.existsSync(vscCodeSettingsJsonPath) && fs.statSync(vscCodeSettingsJsonPath).isFile()) {
            console.log(`Found .vscode/settings.json in ${currentDir}`)
            const settingsContent = JSON.parse(fs.readFileSync(vscCodeSettingsJsonPath, 'utf-8'))
            // Get and resolve paths from both settings
            const analysisPaths = (settingsContent['python.analysis.extraPaths'] || []).map((rawPath: string) =>
                this.resolvePath(rawPath, currentDir)
            )
            const autoCompletePaths = (settingsContent['python.autoComplete.extraPaths'] || []).map((rawPath: string) =>
                this.resolvePath(rawPath, currentDir)
            )
            // Find all unique site-packages directories
            const sitePackagesPaths = this.findSitePackagesPaths([...analysisPaths, ...autoCompletePaths])
            if (sitePackagesPaths.length === 0) {
                this.logging.log('No site-packages directories found in Python paths')
            } else {
                result = {
                    pkgDir: currentDir,
                    vscCodeSettingsJsonPath: vscCodeSettingsJsonPath,
                    sitePackagesPaths: sitePackagesPaths,
                    workspaceFolder: workspaceFolder,
                }
                this.pythonDependencyInfos.push(result)
            }
        }
        return result !== null
    }

    /**
     * It will create a dependency map from the site-packages
     * The dependency map will contain the following properties:
     * - name: the name of the dependency
     * - version: the version of the dependency
     * - path: the path to the dependency
     */
    initiateDependencyMap(): void {
        this.pythonDependencyInfos.forEach(pythonDependencyInfo => {
            try {
                this.dependencyMap.set(
                    pythonDependencyInfo.workspaceFolder,
                    this.generateDependencyMap(pythonDependencyInfo)
                )
                // Log found dependencies
                this.logging.log(
                    `Total python dependencies found: ${this.dependencyMap.size} under ${pythonDependencyInfo.pkgDir}`
                )
            } catch (error) {
                this.logging.log(`Error processing Python dependencies: ${error}`)
            }
        })

        return
    }

    /**
     * It will setup watchers for the .classpath files.
     * When a change is detected, it will update the dependency map.
     */
    setupWatchers(): void {
        this.pythonDependencyInfos.forEach(pythonDependencyInfo => {
            pythonDependencyInfo.sitePackagesPaths.forEach(sitePackagesPath => {
                try {
                    const watcher = fs.watch(sitePackagesPath, { recursive: false }, (eventType, fileName) => {
                        if (!fileName) return
                        // Handle event types
                        if (eventType === 'rename') {
                            const updatedDependencyMap: Map<string, Dependency> = new Map<string, Dependency>()
                            if (this.isMetadataDirectory(fileName)) {
                                this.handleMetadataChange(sitePackagesPath, fileName, updatedDependencyMap)
                            } else {
                                this.handlePackageChange(sitePackagesPath, fileName, updatedDependencyMap)
                            }
                            this.compareAndUpdateDependencies(pythonDependencyInfo, updatedDependencyMap)
                        }
                    })
                    this.dependencyWatchers.set(sitePackagesPath, watcher)
                    this.logging.log(`Started watching Python site-packages: ${sitePackagesPath}`)
                } catch (error) {
                    this.logging.log(`Error setting up watcher for ${sitePackagesPath}: ${error}`)
                }
            })
        })
    }

    /**
     * It will generate a dependency map from the site-packages
     * The dependency map will contain the following properties:
     *
     * @param pythonDependencyInfo
     * @param dependencyMap
     */
    generateDependencyMap(pythonDependencyInfo: PythonDependencyInfo) {
        const dependencyMap = new Map<string, Dependency>()
        // Process each site-packages directory
        for (const sitePackagesPath of pythonDependencyInfo.sitePackagesPaths) {
            const sitePackagesContent = fs.readdirSync(sitePackagesPath)

            for (const item of sitePackagesContent) {
                const itemPath = path.join(sitePackagesPath, item)

                // Skip if not a directory or if it's a metadata directory
                if (this.isMetadataDirectory(itemPath)) {
                    continue
                }

                // Add to dependency map if not already present
                if (!dependencyMap.has(item)) {
                    let dependencySize: number = 0
                    if (isDirectory(itemPath)) {
                        dependencySize = this.getDirectorySize(itemPath)
                    } else {
                        dependencySize = fs.statSync(itemPath).size
                    }
                    dependencyMap.set(item, {
                        name: item,
                        version: 'unknown',
                        path: itemPath,
                        size: dependencySize,
                    })
                }
            }
        }
        return dependencyMap
    }

    private isMetadataDirectory(filename: string): boolean {
        return filename.endsWith('.egg-info') || filename.endsWith('.dist-info') || filename.endsWith('-info')
    }

    private handleMetadataChange(
        sitePackagesPath: string,
        metadataDir: string,
        updatedDependencyMap: Map<string, Dependency>
    ): void {
        // Extract package name from metadata directory name
        // Example: 'requests-2.28.1.dist-info' -> 'requests'
        const dependencyName = metadataDir.split('-')[0]

        // Check if we have this package in our dependency map
        const dependencyPath = path.join(sitePackagesPath, dependencyName)
        if (fs.existsSync(dependencyPath)) {
            // Mark the package as updated
            const updatedDependency = {
                name: dependencyName,
                version: 'unknown',
                path: dependencyPath,
                size: this.getDirectorySize(dependencyPath),
            }
            updatedDependencyMap.set(dependencyName, updatedDependency)
            this.logging.log(`Python package updated (metadata change): ${dependencyPath}`)
        }
    }

    private handlePackageChange(
        sitePackagesPath: string,
        fileName: string,
        updatedDependencyMap: Map<string, Dependency>
    ): void {
        const dependencyPath = path.join(sitePackagesPath, fileName)
        if (fs.existsSync(dependencyPath)) {
            const updatedDependency = {
                name: fileName,
                version: 'unknown',
                path: dependencyPath,
                size: this.getDirectorySize(dependencyPath),
            }
            updatedDependencyMap.set(fileName, updatedDependency)
            this.logging.log(`Python package updated: ${fileName}`)
        }
    }

    private resolvePath(rawPath: string, workspaceFolder: string): string {
        // resolve the path which may contain variables
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
