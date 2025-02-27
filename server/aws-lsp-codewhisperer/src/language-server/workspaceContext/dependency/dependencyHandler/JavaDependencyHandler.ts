import { BaseDependencyInfo, Dependency, LanguageDependencyHandler } from './LanguageDependencyHandler'
import * as path from 'path'
import * as fs from 'fs'
import { URI } from 'vscode-uri'
import { findPackageJSON } from 'module'
import * as xml2js from 'xml2js'

export interface JavaDependencyInfo extends BaseDependencyInfo {
    dotClasspathPath: string
}

/*
 * Java Dependency Handler
 *
 * This handler depends on .classpath to discover dependency locations
 */
export class JavaDependencyHandler extends LanguageDependencyHandler<JavaDependencyInfo> {
    private javaDependencyInfos: JavaDependencyInfo[] = []

    /*
     * It will return a boolean indicating whether it finds any dependency info.
     * The JavaDependencyInfo object contains the following properties:
     * - pkgDir: the package directory
     * - dotClasspathPath: the path to the .classpath file
     */
    discover(currentDir: string): boolean {
        let result: JavaDependencyInfo | null = null
        const dotClasspathPath = path.join(currentDir, '.classpath')
        if (fs.existsSync(dotClasspathPath) && fs.statSync(dotClasspathPath).isFile()) {
            console.log(`Found .classpath in ${currentDir}`)
            result = { pkgDir: currentDir, dotClasspathPath: dotClasspathPath }
            this.javaDependencyInfos.push(result)
        }

        return result !== null
    }

    /*
     * It will create a dependency map from the .classpath file.
     * The dependency map will contain the following properties:
     * - name: the name of the dependency
     * - version: the version of the dependency
     * - path: the path to the dependency
     */
    createDependencyMap(): void {
        for (const javaDependencyInfo of this.javaDependencyInfos) {
            try {
                this.generateDependencyMap(javaDependencyInfo, this.dependencyMap)
                // Log found dependencies
                this.logging.log(
                    `Total java dependencies found: ${this.dependencyMap.size} under ${javaDependencyInfo.pkgDir}`
                )
            } catch (error) {
                this.logging.log(`Error processing Java dependencies: ${error}`)
            }
        }
    }

    /*
     * It will setup watchers for the .classpath files.
     * When a change is detected, it will update the dependency map.
     */
    setupWatchers(): void {
        this.javaDependencyInfos.forEach((javaDependencyInfo: JavaDependencyInfo) => {
            const dotClasspathPath = javaDependencyInfo.dotClasspathPath
            this.logging.log(`Setting up java dependency watcher for ${dotClasspathPath}`)
            try {
                const watcher = fs.watch(dotClasspathPath, (eventType, filename) => {
                    const updatedDependencyMap: Map<string, Dependency> = new Map<string, Dependency>()
                    if (eventType === 'change') {
                        this.logging.log(`Change detected in ${dotClasspathPath}`)
                        this.generateDependencyMap(javaDependencyInfo, updatedDependencyMap)
                        this.compareAndUpdateDependencies(updatedDependencyMap)
                    }
                })
                this.dependencyWatchers.set(dotClasspathPath, watcher)
            } catch (error) {
                this.logging.log(`Error setting up watcher for ${dotClasspathPath}: ${error}`)
            }
        })
    }

    /*
     * It will parse .classpath file and find location of dependency jars with version
     */
    generateDependencyMap(javaDependencyInfo: JavaDependencyInfo, dependencyMap: Map<string, Dependency>) {
        // Read and parse .classpath XML file
        const dotClasspathPath = javaDependencyInfo.dotClasspathPath
        const parser = new xml2js.Parser()
        const classpathContent = fs.readFileSync(dotClasspathPath, 'utf-8')

        parser.parseString(classpathContent, (err: any, result: any) => {
            if (err) {
                this.logging.log(`Error parsing .classpath: ${err}`)
                return
            }

            // Process classpathentry elements
            if (result.classpath && result.classpath.classpathentry) {
                result.classpath.classpathentry.forEach((entry: any) => {
                    if (entry.$ && entry.$.kind === 'lib' && entry.$.path) {
                        const jarPath = entry.$.path

                        // Extract name and version from jar path
                        // Example path patterns:
                        // - lib/dependency-1.2.3.jar
                        // - lib/dependency-1.2.3-SNAPSHOT.jar
                        // - ~/.m2/repository/com/example/dependency/1.2.3/dependency-1.2.3.jar
                        const jarName = path.basename(jarPath)
                        const match = jarName.match(/^(.*?)(?:-([\d.]+(?:-SNAPSHOT)?))?.jar$/)

                        if (match) {
                            const name = match[1]
                            const version = match[2] || 'unknown'
                            const absolutePath = path.isAbsolute(jarPath)
                                ? jarPath
                                : path.resolve(path.dirname(dotClasspathPath), jarPath)

                            if (fs.existsSync(absolutePath)) {
                                dependencyMap.set(name, {
                                    name,
                                    version,
                                    path: absolutePath,
                                })
                            }
                        }
                    }
                })
            }
        })
    }
}
