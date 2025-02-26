import { BaseDependencyInfo, Dependency, LanguageDependencyHandler } from './LanguageDependencyHandler'
import * as path from 'path'
import * as fs from 'fs'

interface JSTSDependencyInfo extends BaseDependencyInfo {
    packageJsonPath: string
    nodeModulesPath: string
}

export class JSTSDependencyHandler extends LanguageDependencyHandler<JSTSDependencyInfo> {
    private jstsDependencyInfos: JSTSDependencyInfo[] = []

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

    createDependencyMap(): Map<string, Dependency> {
        const dependencyMap = new Map<string, Dependency>()

        this.jstsDependencyInfos.forEach(jstsDependencyInfo => {
            let packageJsonPath = jstsDependencyInfo.packageJsonPath
            let nodeModulesPath = jstsDependencyInfo.nodeModulesPath
            try {
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

                // Log found dependencies
                this.logging.log(
                    `Total javascript/typescript dependencies found: ${dependencyMap.size} under ${jstsDependencyInfo.pkgDir}`
                )
            } catch (error) {
                this.logging.log(`Error parsing dependencies: ${error}`)
            }
        })

        return dependencyMap
    }
}
