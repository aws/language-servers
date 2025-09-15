import * as fs from 'fs/promises'
import * as path from 'path'
import * as xml2js from 'xml2js'
import glob = require('fast-glob')
import { create } from 'xmlbuilder2'
import { FileMetadata } from './artifactManager'
import { URI } from 'vscode-uri'
import { WorkspaceFolder } from '@aws/language-server-runtimes/protocol'
import { Logging } from '@aws/language-server-runtimes/server-interface'

const IGNORE_PATTERNS = [
    // Package management and git
    '**/node_modules/**',
    '**/.git/**',
    // Build outputs
    '**/dist/**',
    '**/build/**',
    '**/out/**',
    // Test directories
    '**/test/**',
    '**/tests/**',
    '**/coverage/**',
    // Hidden directories and files
    '**/.*/**',
    '**/.*',
    // Logs and temporary files
    '**/logs/**',
    '**/tmp/**',
    // Environment and configuration
    '**/env/**',
    '**/venv/**',
    '**/bin/**',
    // Framework specific
    '**/target/**', // Maven/Gradle builds
]

interface SourcePath {
    path: string
    isOptional: boolean
    isGenerated?: boolean
}

interface LibraryArtifact {
    libraryPath: string
    sourcesPath?: string
    documentationPath?: string
}

interface JavaProjectStructure {
    sourceDirectories: SourcePath[]
    testDirectories: SourcePath[]
    resourceDirectories: SourcePath[]
    testResourceDirectories: SourcePath[]
    outputDirectory: string
    testOutputDirectory: string
    javaVersion: string
    dependencies: LibraryArtifact[]
    annotationProcessors?: {
        processors: string[]
        options: Record<string, string>
    }
}

// Similar to Bemol's ClasspathAttribute enum
enum ClasspathAttribute {
    MODULE = 'module',
    OPTIONAL = 'optional',
    TEST = 'test',
    JAVADOC_LOCATION = 'javadoc_location',
    IGNORE_OPTIONAL_PROBLEMS = 'ignore_optional_problems',
}

interface SourcePath {
    path: string
    isOptional: boolean
    isGenerated?: boolean
}

interface LibraryArtifact {
    libraryPath: string
    sourcesPath?: string
    documentationPath?: string
}

interface MavenDependency {
    groupId: string
    artifactId: string
    version: string
    scope?: string
}

interface JavaProjectStructure {
    sourceDirectories: SourcePath[]
    testDirectories: SourcePath[]
    resourceDirectories: SourcePath[]
    testResourceDirectories: SourcePath[]
    outputDirectory: string
    testOutputDirectory: string
    javaVersion: string
    dependencies: LibraryArtifact[]
    annotationProcessors?: {
        processors: string[]
        options: Record<string, string>
    }
}

type BuildSystem = 'maven' | 'gradle' | 'unknown'

export class JavaProjectAnalyzer {
    private readonly defaultMavenStructure = {
        sources: 'src/main/java',
        resources: 'src/main/resources',
        tests: 'src/test/java',
        testResources: 'src/test/resources',
        generated: 'target/generated-sources',
        generatedTest: 'target/generated-test-sources',
    }

    private readonly defaultGradleStructure = {
        sources: 'src/main/java',
        resources: 'src/main/resources',
        tests: 'src/test/java',
        testResources: 'src/test/resources',
        generated: 'build/generated/sources/main',
        generatedTest: 'build/generated/sources/test',
    }

    constructor(private readonly workspacePath: string) {}

    async analyze(): Promise<JavaProjectStructure> {
        const buildSystem = await this.detectBuildSystem()

        const [
            sourceDirectories,
            testDirectories,
            resourceDirectories,
            testResourceDirectories,
            javaVersion,
            dependencies,
            annotationProcessors,
        ] = await Promise.all([
            this.findSourceDirectories(buildSystem),
            this.findTestDirectories(buildSystem),
            this.findResourceDirectories(buildSystem),
            this.findTestResourceDirectories(buildSystem),
            this.detectJavaVersion(buildSystem),
            this.analyzeDependencies(buildSystem),
            this.findAnnotationProcessors(buildSystem),
        ])

        return {
            sourceDirectories,
            testDirectories,
            resourceDirectories,
            testResourceDirectories,
            outputDirectory: this.getOutputDirectory(buildSystem),
            testOutputDirectory: this.getTestOutputDirectory(buildSystem),
            javaVersion,
            dependencies,
            annotationProcessors,
        }
    }

    private async detectBuildSystem(): Promise<BuildSystem> {
        const hasPom = await this.fileExists('pom.xml')
        if (hasPom) return 'maven'

        const hasGradle = (await this.fileExists('build.gradle')) || (await this.fileExists('build.gradle.kts'))
        if (hasGradle) return 'gradle'

        return 'unknown'
    }

    private async findSourceDirectories(buildSystem: BuildSystem): Promise<SourcePath[]> {
        const directories: SourcePath[] = []
        const seenPaths = new Set<string>()

        // Add default source directory based on build system
        const defaultSource =
            buildSystem === 'maven' ? this.defaultMavenStructure.sources : this.defaultGradleStructure.sources

        if (await this.fileExists(defaultSource)) {
            directories.push({
                path: defaultSource,
                isOptional: false,
            })
            seenPaths.add(defaultSource)
        }

        // Add generated sources
        const generatedDir =
            buildSystem === 'maven' ? this.defaultMavenStructure.generated : this.defaultGradleStructure.generated

        if (await this.fileExists(generatedDir)) {
            directories.push({
                path: generatedDir,
                isOptional: true,
                isGenerated: true,
            })
            seenPaths.add(generatedDir)
        }

        // For Maven, parse pom.xml for additional source directories
        if (buildSystem === 'maven') {
            const additionalSources = await this.parseMavenSourceDirectories()
            for (const source of additionalSources) {
                if (!seenPaths.has(source.path)) {
                    directories.push(source)
                    seenPaths.add(source.path)
                }
            }
        }

        // For Gradle, parse build.gradle for additional source directories
        if (buildSystem === 'gradle') {
            const additionalSources = await this.parseGradleSourceDirectories()
            for (const source of additionalSources) {
                if (!seenPaths.has(source.path)) {
                    directories.push(source)
                    seenPaths.add(source.path)
                }
            }
        }

        // Always scan for potential source directories as a fallback
        // This will help catch non-standard source locations
        const potentialSources = await this.findPotentialSourceDirectories()
        for (const source of potentialSources) {
            if (!seenPaths.has(source.path)) {
                directories.push(source)
                seenPaths.add(source.path)
            }
        }

        return directories
    }

    private async findPotentialSourceDirectories(): Promise<SourcePath[]> {
        const potentialSources: SourcePath[] = []
        const seenPaths = new Set<string>()

        const patterns = [
            'src/**/*.java',
            'source/**/*.java',
            'java/**/*.java',
            'main/**/*.java',
            'app/**/*.java',
            'test/**/*.java',
        ]

        for (const pattern of patterns) {
            const javaFiles = await glob(pattern, {
                cwd: this.workspacePath,
                ignore: IGNORE_PATTERNS,
            })

            for (const file of javaFiles) {
                // Find the directory containing the first package directory (usually 'com', 'org', etc.)
                const fullPath = path.dirname(file)
                const pathParts = fullPath.split(path.sep)

                // Find index of first package directory (com, org, etc.)
                const packageStartIndex = pathParts.findIndex(
                    part => part === 'com' || part === 'org' || part === 'net' || part === 'java'
                )

                if (packageStartIndex > 0) {
                    // The source root is the directory containing the package root
                    const sourceDir = path.join(...pathParts.slice(0, packageStartIndex))

                    if (!seenPaths.has(sourceDir)) {
                        seenPaths.add(sourceDir)

                        const isTest =
                            sourceDir.toLowerCase().includes('test') || sourceDir.toLowerCase().includes('tst')
                        const isGenerated = sourceDir.toLowerCase().includes('generated')

                        potentialSources.push({
                            path: sourceDir,
                            isOptional: isGenerated || isTest,
                            isGenerated,
                        })
                    }
                }
            }
        }

        // Validate directories
        const validatedSources: SourcePath[] = []
        for (const source of potentialSources) {
            const hasJavaFiles = await this.hasJavaFiles(source.path)
            if (hasJavaFiles) {
                validatedSources.push(source)
            }
        }

        return validatedSources
    }

    private async hasJavaFiles(directory: string): Promise<boolean> {
        const javaFiles = await glob('**/*.java', {
            cwd: path.join(this.workspacePath, directory),
        })
        return javaFiles.length > 0
    }

    private async findTestDirectories(buildSystem: BuildSystem): Promise<SourcePath[]> {
        const directories: SourcePath[] = []

        // Define default test paths based on build system
        let defaultTestPath: string
        let generatedTestPath: string

        switch (buildSystem) {
            case 'maven':
                defaultTestPath = this.defaultMavenStructure.tests
                generatedTestPath = this.defaultMavenStructure.generatedTest
                break
            case 'gradle':
                defaultTestPath = this.defaultGradleStructure.tests
                generatedTestPath = this.defaultGradleStructure.generatedTest
                break
            default:
                defaultTestPath = 'test'
                generatedTestPath = 'generated-test'
        }

        // Check main test directory
        if (await this.fileExists(defaultTestPath)) {
            directories.push({
                path: defaultTestPath,
                isOptional: false,
            })
        }

        // Check generated test sources
        if (await this.fileExists(generatedTestPath)) {
            directories.push({
                path: generatedTestPath,
                isOptional: true,
                isGenerated: true,
            })
        }

        return directories
    }

    private async findResourceDirectories(buildSystem: BuildSystem): Promise<SourcePath[]> {
        const directories: SourcePath[] = []

        const resourcePaths = {
            maven: this.defaultMavenStructure.resources,
            gradle: this.defaultGradleStructure.resources,
            unknown: ['resources', 'src/resources', 'conf'],
        }

        const paths = resourcePaths[buildSystem] || resourcePaths.unknown

        for (const resourcePath of paths) {
            if (await this.fileExists(resourcePath)) {
                directories.push({
                    path: resourcePath,
                    isOptional: true,
                })
            }
        }

        return directories
    }

    private async findTestResourceDirectories(buildSystem: BuildSystem): Promise<SourcePath[]> {
        const directories: SourcePath[] = []

        const defaultTestResources =
            buildSystem === 'maven'
                ? this.defaultMavenStructure.testResources
                : this.defaultGradleStructure.testResources

        if (await this.fileExists(defaultTestResources)) {
            directories.push({
                path: defaultTestResources,
                isOptional: true,
            })
        }

        return directories
    }

    private async detectJavaVersion(buildSystem: BuildSystem): Promise<string> {
        if (buildSystem === 'maven') {
            const pomContent = await this.readPomXml()
            if (pomContent) {
                const parsed = await xml2js.parseStringPromise(pomContent)
                return (
                    parsed?.project?.properties?.[0]?.['java.version']?.[0] ||
                    parsed?.project?.properties?.[0]?.['maven.compiler.source']?.[0] ||
                    '11'
                ) // Default to Java 11 if not specified
            }
        }

        if (buildSystem === 'gradle') {
            const gradleContent = await this.readGradleFile()
            if (gradleContent) {
                const sourceCompatibilityMatch = gradleContent.match(/sourceCompatibility\s*=\s*['"](.+)['"]/)
                if (sourceCompatibilityMatch) {
                    return sourceCompatibilityMatch[1]
                }
            }
        }

        return '11' // Default to Java 11 if not detected
    }

    private async analyzeDependencies(buildSystem: BuildSystem): Promise<LibraryArtifact[]> {
        const dependencies: LibraryArtifact[] = []

        if (buildSystem === 'maven') {
            const pomContent = await this.readPomXml()
            if (pomContent) {
                const parsed = await xml2js.parseStringPromise(pomContent)
                const mavenDeps = parsed?.project?.dependencies?.[0]?.dependency || []

                for (const dep of mavenDeps) {
                    const groupId = dep.groupId[0]
                    const artifactId = dep.artifactId[0]
                    const version = dep.version?.[0] || 'LATEST'

                    // Here you would need to resolve the actual JAR paths
                    // This is a simplified example
                    dependencies.push({
                        libraryPath: `${groupId}/${artifactId}/${version}/${artifactId}-${version}.jar`,
                        sourcesPath: `${groupId}/${artifactId}/${version}/${artifactId}-${version}-sources.jar`,
                    })
                }
            }
        }

        // Also check for local JARs in lib directory
        const libPath = path.join(this.workspacePath, 'lib')
        if (await this.fileExists(libPath)) {
            const localJars = await glob('**/*.jar', { cwd: libPath })
            for (const jar of localJars) {
                dependencies.push({
                    libraryPath: path.join('lib', jar),
                })
            }
        }
        return dependencies
    }

    private async findAnnotationProcessors(
        buildSystem: BuildSystem
    ): Promise<{ processors: string[]; options: Record<string, string> }> {
        const processors: string[] = []
        const options: Record<string, string> = {}

        if (buildSystem === 'maven') {
            const pomContent = await this.readPomXml()
            if (pomContent) {
                const parsed = await xml2js.parseStringPromise(pomContent)
                // Parse annotation processors from maven-compiler-plugin configuration
                const plugins = parsed?.project?.build?.[0]?.plugins?.[0]?.plugin || []
                for (const plugin of plugins) {
                    if (plugin.artifactId[0] === 'maven-compiler-plugin') {
                        const config = plugin.configuration?.[0]
                        if (config?.annotationProcessors) {
                            processors.push(...config.annotationProcessors[0].processor)
                        }
                    }
                }
            }
        }

        return { processors, options }
    }

    private getOutputDirectory(buildSystem: BuildSystem): string {
        switch (buildSystem) {
            case 'maven':
                return 'target/classes'
            case 'gradle':
                return 'build/classes/java/main'
            case 'unknown':
                return 'bin' // Common default for basic Java projects
            default:
                return 'out' // Fallback directory
        }
    }

    private getTestOutputDirectory(buildSystem: BuildSystem): string {
        switch (buildSystem) {
            case 'maven':
                return 'target/test-classes'
            case 'gradle':
                return 'build/classes/java/test'
            case 'unknown':
                return 'bin/test' // Common default for basic Java projects
            default:
                return 'out/test' // Fallback directory
        }
    }

    private async fileExists(relativePath: string): Promise<boolean> {
        try {
            await fs.access(path.join(this.workspacePath, relativePath))
            return true
        } catch {
            return false
        }
    }

    private async readPomXml(): Promise<string | null> {
        try {
            return await fs.readFile(path.join(this.workspacePath, 'pom.xml'), 'utf-8')
        } catch {
            return null
        }
    }

    private async readGradleFile(): Promise<string | null> {
        try {
            const gradlePath = (await this.fileExists('build.gradle.kts')) ? 'build.gradle.kts' : 'build.gradle'
            return await fs.readFile(path.join(this.workspacePath, gradlePath), 'utf-8')
        } catch {
            return null
        }
    }

    private async parseMavenSourceDirectories(): Promise<SourcePath[]> {
        const directories: SourcePath[] = []
        const pomContent = await this.readPomXml()

        if (pomContent) {
            const parsed = await xml2js.parseStringPromise(pomContent)
            const build = parsed?.project?.build?.[0]

            // Parse additional source directories from build/sourceDirectory
            if (build?.sourceDirectory) {
                directories.push({
                    path: build.sourceDirectory[0],
                    isOptional: false,
                })
            }
        }

        return directories
    }

    private async parseGradleSourceDirectories(): Promise<SourcePath[]> {
        const directories: SourcePath[] = []
        const gradleContent = await this.readGradleFile()

        if (gradleContent) {
            // Parse sourceSets from build.gradle
            // This is a simplified implementation
            const sourceSetMatches = gradleContent.matchAll(
                /sourceSets\s*{\s*main\s*{\s*java\s*{\s*srcDirs\s*=\s*\[(.*?)\]/gs
            )

            for (const match of sourceSetMatches) {
                const srcDirs = match[1]
                    .split(',')
                    .map(dir => dir.trim().replace(/['"]/g, ''))
                    .filter(dir => dir)

                for (const dir of srcDirs) {
                    directories.push({
                        path: dir,
                        isOptional: false,
                    })
                }
            }
        }

        return directories
    }
}

export class EclipseConfigGenerator {
    private readonly projectFiles: Map<string, FileMetadata[]>
    private initializationPromise: Promise<void> | null = null
    private readonly workspacePath: string

    constructor(
        private readonly workspaceFolder: WorkspaceFolder,
        private readonly logging: Logging
    ) {
        this.projectFiles = new Map()
        this.workspacePath = URI.parse(workspaceFolder.uri).path
        this.initializeProjectFiles().catch(error => {
            this.logging.warn(`Failed to initialize Java project files:  ${error}`)
        })
    }
    async generateDotClasspath(structure: JavaProjectStructure): Promise<FileMetadata[]> {
        await this.ensureInitialized()
        const existingClasspaths = this.projectFiles.get('.classpath') || []

        if (existingClasspaths.length > 0) {
            return existingClasspaths
        }

        const builder = create({ version: '1.0', encoding: 'UTF-8' })
        const classpath = builder.ele('classpath')

        // Add default output directory
        const output = classpath.ele('classpathentry').att('kind', 'output').att('path', structure.outputDirectory)

        // Add JRE container
        const container = classpath
            .ele('classpathentry')
            .att('kind', 'con')
            .att(
                'path',
                `org.eclipse.jdt.launching.JRE_CONTAINER/org.eclipse.jdt.internal.debug.ui.launcher.StandardVMType/JavaSE-${structure.javaVersion}`
            )
        this.addAttribute(container, ClasspathAttribute.MODULE)

        // Add source folders
        for (const src of structure.sourceDirectories) {
            const entry = classpath.ele('classpathentry').att('kind', 'src').att('path', this.normalizePath(src.path))

            if (src.isOptional) {
                this.addAttribute(entry, ClasspathAttribute.OPTIONAL)
            }
            if (src.isGenerated) {
                this.addAttribute(entry, ClasspathAttribute.IGNORE_OPTIONAL_PROBLEMS)
            }
        }

        // Add resource folders
        for (const resource of structure.resourceDirectories) {
            const entry = classpath
                .ele('classpathentry')
                .att('kind', 'src')
                .att('path', this.normalizePath(resource.path))
                .att('output', structure.outputDirectory)

            if (resource.isOptional) {
                this.addAttribute(entry, ClasspathAttribute.OPTIONAL)
            }
        }

        // Add test source folders
        for (const test of structure.testDirectories) {
            const entry = classpath
                .ele('classpathentry')
                .att('kind', 'src')
                .att('path', this.normalizePath(test.path))
                .att('output', structure.testOutputDirectory)

            this.addAttribute(entry, ClasspathAttribute.TEST)
            if (test.isOptional) {
                this.addAttribute(entry, ClasspathAttribute.OPTIONAL)
            }
            if (test.isGenerated) {
                this.addAttribute(entry, ClasspathAttribute.IGNORE_OPTIONAL_PROBLEMS)
            }
        }

        // Add test resource folders
        for (const testResource of structure.testResourceDirectories) {
            const entry = classpath
                .ele('classpathentry')
                .att('kind', 'src')
                .att('path', this.normalizePath(testResource.path))
                .att('output', structure.testOutputDirectory)

            this.addAttribute(entry, ClasspathAttribute.TEST)
            if (testResource.isOptional) {
                this.addAttribute(entry, ClasspathAttribute.OPTIONAL)
            }
        }

        // Add dependencies
        for (const dep of structure.dependencies) {
            const entry = classpath
                .ele('classpathentry')
                .att('kind', 'lib')
                .att('path', this.normalizePath(dep.libraryPath))

            if (dep.sourcesPath) {
                entry.att('sourcepath', this.normalizePath(dep.sourcesPath))
            }
            if (dep.documentationPath) {
                this.addAttribute(
                    entry,
                    ClasspathAttribute.JAVADOC_LOCATION,
                    `file:${this.normalizePath(dep.documentationPath)}`
                )
            }
        }

        // Add annotation processor generated source folders if needed
        if (structure.annotationProcessors && structure.annotationProcessors.processors.length > 0) {
            // Add generated sources output
            const aptSrcEntry = classpath
                .ele('classpathentry')
                .att('kind', 'src')
                .att('path', 'target/generated-sources/annotations')
                .att('output', structure.outputDirectory)

            this.addAttribute(aptSrcEntry, ClasspathAttribute.OPTIONAL)
            this.addAttribute(aptSrcEntry, ClasspathAttribute.IGNORE_OPTIONAL_PROBLEMS)

            // Add generated test sources output
            const aptTestEntry = classpath
                .ele('classpathentry')
                .att('kind', 'src')
                .att('path', 'target/generated-test-sources/test-annotations')
                .att('output', structure.testOutputDirectory)

            this.addAttribute(aptTestEntry, ClasspathAttribute.OPTIONAL)
            this.addAttribute(aptTestEntry, ClasspathAttribute.TEST)
            this.addAttribute(aptTestEntry, ClasspathAttribute.IGNORE_OPTIONAL_PROBLEMS)
        }

        const generatedContent = Buffer.from(builder.end({ prettyPrint: true }))
        const relativePath = '.classpath'

        const newClasspathFile: FileMetadata = {
            filePath: path.join(this.workspacePath, relativePath),
            relativePath,
            language: 'java',
            contentLength: generatedContent.length,
            lastModified: Date.now(),
            content: generatedContent,
            workspaceFolder: this.workspaceFolder,
        }

        return [newClasspathFile]
    }

    async generateDotProject(projectName: string, structure: JavaProjectStructure): Promise<FileMetadata[]> {
        await this.ensureInitialized()
        const existingProjects = this.projectFiles.get('.project') || []

        if (existingProjects.length > 0) {
            return existingProjects
        }

        const builder = create({ version: '1.0', encoding: 'UTF-8' })
        const project = builder.ele('projectDescription')

        project.ele('name').txt(projectName)
        project.ele('comment').txt('Generated by Eclipse Project Generator')

        // Add build specification
        const buildSpec = project.ele('buildSpec')
        const buildCommand = buildSpec.ele('buildCommand')
        buildCommand.ele('name').txt('org.eclipse.jdt.core.javabuilder')

        // Add project natures
        const natures = project.ele('natures')
        natures.ele('nature').txt('org.eclipse.jdt.core.javanature')

        // Add linked resources if we have any generated sources
        const hasGeneratedSources =
            structure.sourceDirectories.some(src => src.isGenerated) ||
            structure.testDirectories.some(test => test.isGenerated)

        if (hasGeneratedSources) {
            const linkedResources = project.ele('linkedResources')
            const link = linkedResources.ele('link')
            link.ele('name').txt('.generated')
            link.ele('type').txt('2') // Type 2 is folder
            link.ele('location').txt(path.resolve(process.cwd(), 'target/generated-sources'))
        }

        const generatedContent = Buffer.from(builder.end({ prettyPrint: true }))
        const relativePath = '.project'

        const newProjectFile: FileMetadata = {
            filePath: path.join(this.workspacePath, relativePath),
            relativePath,
            language: 'java',
            contentLength: generatedContent.length,
            lastModified: Date.now(),
            content: generatedContent,
            workspaceFolder: this.workspaceFolder,
        }

        return [newProjectFile]
    }

    async generateDotFactorypath(structure: JavaProjectStructure): Promise<string> {
        // Only generate factorypath if we have annotation processors
        if (!structure.annotationProcessors || structure.annotationProcessors.processors.length === 0) {
            return ''
        }

        const builder = create({ version: '1.0', encoding: 'UTF-8' })
        const factorypath = builder.ele('factorypath')

        // Add all dependencies that might contain annotation processors
        for (const dep of structure.dependencies) {
            const entry = factorypath
                .ele('factorypathentry')
                .att('kind', 'EXTJAR')
                .att('id', this.normalizePath(dep.libraryPath))
                .att('enabled', 'true')
                .att('runInBatchMode', 'false')
        }

        return builder.end({ prettyPrint: true })
    }

    async generateDotSettings(structure: JavaProjectStructure): Promise<Map<string, string>> {
        const settings = new Map<string, string>()

        // Generate JDT core preferences
        const jdtCore = create({ version: '1.0', encoding: 'UTF-8' })
        const corePrefs = jdtCore.ele('properties')

        corePrefs.ele('entry').att('key', 'eclipse.preferences.version').att('value', '1')

        corePrefs
            .ele('entry')
            .att('key', 'org.eclipse.jdt.core.compiler.codegen.targetPlatform')
            .att('value', structure.javaVersion)

        corePrefs
            .ele('entry')
            .att('key', 'org.eclipse.jdt.core.compiler.compliance')
            .att('value', structure.javaVersion)

        corePrefs.ele('entry').att('key', 'org.eclipse.jdt.core.compiler.source').att('value', structure.javaVersion)

        settings.set('org.eclipse.jdt.core.prefs', jdtCore.end({ prettyPrint: true }))

        // Generate APT preferences if we have annotation processors
        if (structure.annotationProcessors && structure.annotationProcessors.processors.length > 0) {
            const jdtApt = create({ version: '1.0', encoding: 'UTF-8' })
            const aptPrefs = jdtApt.ele('properties')

            aptPrefs.ele('entry').att('key', 'eclipse.preferences.version').att('value', '1')

            aptPrefs.ele('entry').att('key', 'org.eclipse.jdt.apt.aptEnabled').att('value', 'true')

            aptPrefs
                .ele('entry')
                .att('key', 'org.eclipse.jdt.apt.genSrcDir')
                .att('value', 'target/generated-sources/annotations')

            aptPrefs
                .ele('entry')
                .att('key', 'org.eclipse.jdt.apt.genTestSrcDir')
                .att('value', 'target/generated-test-sources/test-annotations')

            // Add annotation processor options
            for (const [key, value] of Object.entries(structure.annotationProcessors.options)) {
                aptPrefs.ele('entry').att('key', `org.eclipse.jdt.apt.processorOptions/${key}`).att('value', value)
            }

            settings.set('org.eclipse.jdt.apt.core.prefs', jdtApt.end({ prettyPrint: true }))
        }

        return settings
    }

    private async initializeProjectFiles(): Promise<void> {
        try {
            const eclipseFiles = ['.project', '.classpath']
            for (const fileName of eclipseFiles) {
                const pattern = path.join(this.workspacePath, '**', fileName)
                const files = await glob(pattern, {
                    ignore: IGNORE_PATTERNS.filter(p => p !== '**/.*'),
                    onlyFiles: true,
                    followSymbolicLinks: false,
                    dot: true,
                })

                const fileMetadataArray: FileMetadata[] = []

                for (const file of files) {
                    try {
                        const content = await fs.readFile(file)
                        const relativePath = path.relative(this.workspacePath, file)

                        fileMetadataArray.push({
                            filePath: file,
                            relativePath,
                            language: 'java',
                            contentLength: content.length,
                            lastModified: (await fs.stat(file)).mtimeMs,
                            content,
                            workspaceFolder: this.workspaceFolder,
                        })
                    } catch (error) {
                        this.logging.warn(`Error reading file ${file}: ${error}`)
                    }
                }

                this.projectFiles.set(fileName, fileMetadataArray)
            }
        } catch (error) {
            this.logging.warn(`Error initializing project files: ${error}`)
        }
    }

    private async ensureInitialized(): Promise<void> {
        if (!this.initializationPromise) {
            this.initializationPromise = this.initializeProjectFiles()
        }
        await this.initializationPromise
    }

    private addAttribute(node: any, attribute: ClasspathAttribute, value: string = 'true'): void {
        // Get existing attributes element or create a new one
        let attrs = node.ele('attributes')

        // Add the attribute directly
        attrs.ele('attribute').att('name', attribute).att('value', value)
    }

    private normalizePath(filePath: string): string {
        // Convert to forward slashes for Eclipse
        return filePath.replace(/\\/g, '/')
    }
}
