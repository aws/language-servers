import { BaseDependencyInfo, Dependency, LanguageDependencyHandler } from './LanguageDependencyHandler'
import * as path from 'path'
import * as fs from 'fs'

interface JSTSDependencyInfo extends BaseDependencyInfo {
    packageJsonPath: string
    nodeModulesPath: string
}

/*
 * JSTS Dependency Handler
 *
 * This handler depends on package.json and /node_modules to discover dependency locations
 */
export class JSTSDependencyHandler extends LanguageDependencyHandler<JSTSDependencyInfo> {
    private jstsDependencyInfos: JSTSDependencyInfo[] = []

    /*
     * It will return a boolean indicating whether it finds any dependency info.
     * The JSTSDependencyInfo object contains the following properties:
     * - pkgDir: the package directory
     * - packageJsonPath: the path to the package.json file
     * - nodeModulesPath: the path to /node_modules directory
     */
    discover(currentDir: string): boolean {
        let result: JSTSDependencyInfo | null = null
        const packageJsonPath = path.join(currentDir, 'package.json')
        const nodeModulesPath = path.join(currentDir, 'node_modules')
        if (
            fs.existsSync(packageJsonPath) &&
            fs.existsSync(nodeModulesPath) &&
            fs.statSync(nodeModulesPath).isDirectory()
        ) {
            console.log(`Found package.json and node_modules in ${currentDir}`)
            result = { pkgDir: currentDir, packageJsonPath: packageJsonPath, nodeModulesPath: nodeModulesPath }
            this.jstsDependencyInfos.push(result)
        }
        return result !== null
    }

    /*
     * It will create a dependency map from the package.json file and node_modules
     * The dependency map will contain the following properties:
     * - name: the name of the dependency
     * - version: the version of the dependency
     * - path: the path to the dependency
     */
    createDependencyMap(): void {
        this.jstsDependencyInfos.forEach(jstsDependencyInfo => {
            try {
                this.generateDependencyMap(jstsDependencyInfo, this.dependencyMap)
                // Log found dependencies
                this.logging.log(
                    `Total javascript/typescript dependencies found: ${this.dependencyMap.size} under ${jstsDependencyInfo.pkgDir}`
                )
            } catch (error) {
                this.logging.log(`Error parsing dependencies: ${error}`)
            }
        })
    }

    /*
     * First, it will record dependencies with version under node_modules based on package.json
     * Then, it will also record dependencies with version under node_modules which are not declared in package.json
     */
    generateDependencyMap(jstsDependencyInfo: JSTSDependencyInfo, dependencyMap: Map<string, Dependency>) {
        let packageJsonPath = jstsDependencyInfo.packageJsonPath
        let nodeModulesPath = jstsDependencyInfo.nodeModulesPath
        // Read and parse package.json
        const packageJsonContent = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

        // Combine all types of dependencies
        const allDependencies = {
            ...(packageJsonContent.dependencies || {}),
            ...(packageJsonContent.devDependencies || {}),
            ...(packageJsonContent.peerDependencies || {}),
        }

        // process each dependency
        for (const [name, declaredVersion] of Object.entries(allDependencies)) {
            const dependencyPath = path.join(nodeModulesPath, name)
            // Check if dependency exists in node_modules
            if (fs.existsSync(dependencyPath)) {
                // Read the actual version from the dependency's package.json
                const depPackageJsonPath = path.join(dependencyPath, 'package.json')
                let actualVersion: string = typeof declaredVersion === 'string' ? declaredVersion : 'unknown'

                if (fs.existsSync(depPackageJsonPath)) {
                    const depPackageJson = JSON.parse(fs.readFileSync(depPackageJsonPath, 'utf-8'))
                    actualVersion = depPackageJson.version
                }

                dependencyMap.set(name, {
                    name,
                    version: actualVersion.toString().replace(/[\^~]/g, ''), // Remove ^ and ~ from version
                    path: dependencyPath,
                })
            }
        }

        // Also check node_modules directory for unlisted dependencies
        if (fs.existsSync(nodeModulesPath)) {
            const nodeModulesContent = fs.readdirSync(nodeModulesPath)
            for (const item of nodeModulesContent) {
                // Skip hidden files and scope directories
                if (item.startsWith('.') || item.startsWith('@')) continue

                const itemPath = path.join(nodeModulesPath, item)
                if (!fs.statSync(itemPath).isDirectory()) continue

                // If not already in dependencyMap, add it
                if (!dependencyMap.has(item)) {
                    const depPackageJsonPath = path.join(itemPath, 'package.json')
                    if (fs.existsSync(depPackageJsonPath)) {
                        const depPackageJson = JSON.parse(fs.readFileSync(depPackageJsonPath, 'utf-8'))
                        dependencyMap.set(item, {
                            name: item,
                            version: depPackageJson.version || 'unknown',
                            path: itemPath,
                        })
                    }
                }
            }
        }
    }

    /*
     * It will setup watchers for the .classpath files.
     * When a change is detected, it will update the dependency map.
     */
    setupWatchers(): void {
        this.jstsDependencyInfos.forEach((jstsDependencyInfo: JSTSDependencyInfo) => {
            const packageJsonPath = jstsDependencyInfo.packageJsonPath
            this.logging.log(`Setting up js/ts dependency watcher for ${packageJsonPath}`)
            try {
                const watcher = fs.watch(packageJsonPath, (eventType, filename) => {
                    const updatedDependencyMap: Map<string, Dependency> = new Map<string, Dependency>()
                    if (eventType === 'change') {
                        this.logging.log(`Change detected in ${packageJsonPath}`)
                        this.generateDependencyMap(jstsDependencyInfo, updatedDependencyMap)
                        this.compareAndUpdateDependencies(updatedDependencyMap)
                    }
                })
                this.dependencyWatchers.set(packageJsonPath, watcher)
            } catch (error) {
                this.logging.log(`Error setting up watcher for ${packageJsonPath}: ${error}`)
            }
        })
    }
}
