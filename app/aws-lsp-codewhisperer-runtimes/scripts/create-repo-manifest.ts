// Produces an artifact manifest that is "close enough" to a real one, to
// reference artifacts attached to a GitHub release for main or feature branches.
// The GitHub release only ever holds one artifact version (the most recent commit),
// so the manifest will only ever contain a single artifact version.

import * as fs from 'fs'
import { exec } from 'child_process'
import * as path from 'path'

export type SemVer = string

export type Version = {
    name: string
    version: SemVer
}

export type Platform = 'windows' | 'linux' | 'darwin'
export type Arch = 'arm64' | 'x64'
export type TargetContent = {
    filename: string
    url: string
    hashes: string[]
    bytes: number
}

export type PlatformTarget = {
    platform: Platform
    arch: Arch
    contents: TargetContent[]
}

export type ManifestServerVersionEntry = {
    serverVersion: string
    isDelisted: boolean
    runtime: Version
    capabilities?: Version[]
    protocol?: Version[]
    thirdPartyLicenses: string
    targets: PlatformTarget[]
}

export type Manifest = {
    manifestSchemaVersion: string
    artifactId: string
    artifactDescription: string
    isManifestDeprecated: boolean
    versions: ManifestServerVersionEntry[]
}

interface Params {
    serverVersion: string
    releaseArtifactsPath: string
    repoUrl: string
    gitHubReleaseName: string
}

const serversZipName = 'servers.zip'
const clientsZipName = 'clients.zip'

/**
 * Updates the manifest file with new version information or performs rollback operations.
 *
 * @async
 * @param {string} manifestPath - file path to save the manifest to.
 * @param {Object} params - The parameters for updating the manifest.
 * @param {string} params.serverVersion - The server version.
 * @param {string} params.releaseArtifactsPath - folder containing the artifacts to load file attributes from
 * @param {string} params.repoUrl - url to the github repo (https://github.com/aws/language-servers)
 * @param {string} params.gitHubReleaseName - the name of the GitHub release this will refer to (pre-main)
 *
 * @description
 * This function performs the following operations:
 * 1. Calculates SHA384 checksums and file sizes for clients.zip and servers.zip files.
 * 2. Generates a new manifest entry with the provided and calculated information.
 * 3. Produces a manifest file, containing only this one version.
 * 4. Saves the updated manifest to a file.
 */
export async function updateManifest(
    manifestPath: string,
    { serverVersion, releaseArtifactsPath, repoUrl, gitHubReleaseName }: Params
) {
    function getGitHubReleaseDownloadUrl(filename: string) {
        return `${repoUrl}/releases/download/${gitHubReleaseName}/${filename}`
    }

    function getServerZipPath(platform: string, arch: string): string {
        return path.join(releaseArtifactsPath, `${platform}-${arch}-${serversZipName}`)
    }

    async function getServerZipFileInfo(platform: string, arch: string): Promise<FileInfo> {
        const serverZipPath = getServerZipPath(platform, arch)
        const sha = await run(`sha384sum ${serverZipPath} | awk '{print $1}'`)
        const bytes = await run(`wc -c < ${serverZipPath}`)
        return {
            url: getGitHubReleaseDownloadUrl(path.basename(serverZipPath)),
            hash: sha,
            bytes: bytes,
        }
    }

    const clientZipPath = path.join(releaseArtifactsPath, clientsZipName)

    async function getClientZipFileInfo() {
        const sha = await run(`sha384sum ${clientZipPath} | awk '{print $1}'`)
        const bytes = await run(`wc -c < ${clientZipPath}`)
        return {
            url: getGitHubReleaseDownloadUrl(clientsZipName),
            hash: sha,
            bytes: bytes,
        }
    }

    const manifest: Manifest = {
        manifestSchemaVersion: '0.1',
        artifactId: 'CodeWhispererStandaloneRuntimeServer',
        artifactDescription: 'LSP servers with CodeWhisperer on standalone runtime',
        isManifestDeprecated: false,
        versions: [],
    }

    const licensesURL = 'placeholder'
    const newEntry = generateNewEntry({
        version: {
            server: serverVersion,
        },
        serverZips: {
            win: {
                x64: await getServerZipFileInfo('win', 'x64'),
                arm64: await getServerZipFileInfo('win', 'x64'),
            },
            linux: {
                x64: await getServerZipFileInfo('linux', 'x64'),
                arm64: await getServerZipFileInfo('linux', 'arm64'),
            },
            mac: {
                x64: await getServerZipFileInfo('mac', 'x64'),
                arm64: await getServerZipFileInfo('mac', 'arm64'),
            },
        },
        clientZip: await getClientZipFileInfo(),
        licensesURL,
    })

    manifest.versions = [newEntry]

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
}

interface FileInfo {
    url: string
    hash: string
    bytes: string
}

interface EntryParameters {
    version: {
        server: string
    }
    serverZips: {
        win: {
            x64: FileInfo
            arm64: FileInfo
        }
        linux?: {
            x64: FileInfo
            arm64: FileInfo
        }
        mac?: {
            x64: FileInfo
            arm64: FileInfo
        }
    }
    clientZip: FileInfo
    licensesURL: string
}

function generateNewEntry({
    version,
    serverZips,
    clientZip,
    licensesURL,
}: EntryParameters): ManifestServerVersionEntry {
    return {
        serverVersion: version.server,
        isDelisted: false,
        runtime: {
            name: 'standalone',
            version: '0.0.1', // arbitrary, not used for alpha/preprod manifests
        },
        thirdPartyLicenses: licensesURL,
        targets: [
            {
                platform: 'windows',
                arch: 'x64',
                contents: [
                    {
                        filename: serversZipName,
                        url: serverZips.win.x64.url,
                        hashes: [`sha384:${serverZips.win.x64.hash}`],
                        bytes: parseInt(serverZips.win.x64.bytes),
                    },
                    {
                        filename: clientsZipName,
                        url: clientZip.url,
                        hashes: [`sha384:${clientZip.hash}`],
                        bytes: parseInt(clientZip.bytes),
                    },
                ],
            },
            {
                platform: 'windows',
                arch: 'arm64',
                contents: [
                    {
                        filename: serversZipName,
                        url: serverZips.win.arm64.url,
                        hashes: [`sha384:${serverZips.win.arm64.hash}`],
                        bytes: parseInt(serverZips.win.arm64.bytes),
                    },
                    {
                        filename: clientsZipName,
                        url: clientZip.url,
                        hashes: [`sha384:${clientZip.hash}`],
                        bytes: parseInt(clientZip.bytes),
                    },
                ],
            },
            {
                platform: 'linux',
                arch: 'x64',
                contents: [
                    {
                        filename: serversZipName,
                        url: serverZips.linux!.x64.url,
                        hashes: [`sha384:${serverZips.linux!.x64.hash}`],
                        bytes: parseInt(serverZips.linux!.x64.bytes),
                    },
                    {
                        filename: clientsZipName,
                        url: clientZip.url,
                        hashes: [`sha384:${clientZip.hash}`],
                        bytes: parseInt(clientZip.bytes),
                    },
                ],
            },
            {
                platform: 'linux',
                arch: 'arm64',
                contents: [
                    {
                        filename: serversZipName,
                        url: serverZips.linux!.arm64.url,
                        hashes: [`sha384:${serverZips.linux!.arm64.hash}`],
                        bytes: parseInt(serverZips.linux!.arm64.bytes),
                    },
                    {
                        filename: clientsZipName,
                        url: clientZip.url,
                        hashes: [`sha384:${clientZip.hash}`],
                        bytes: parseInt(clientZip.bytes),
                    },
                ],
            },
            {
                platform: 'darwin',
                arch: 'x64',
                contents: [
                    {
                        filename: serversZipName,
                        url: serverZips.mac!.x64.url,
                        hashes: [`sha384:${serverZips.mac!.x64.hash}`],
                        bytes: parseInt(serverZips.mac!.x64.bytes),
                    },
                    {
                        filename: clientsZipName,
                        url: clientZip.url,
                        hashes: [`sha384:${clientZip.hash}`],
                        bytes: parseInt(clientZip.bytes),
                    },
                ],
            },
            {
                platform: 'darwin',
                arch: 'arm64',
                contents: [
                    {
                        filename: serversZipName,
                        url: serverZips.mac!.arm64.url,
                        hashes: [`sha384:${serverZips.mac!.arm64.hash}`],
                        bytes: parseInt(serverZips.mac!.arm64.bytes),
                    },
                    {
                        filename: clientsZipName,
                        url: clientZip.url,
                        hashes: [`sha384:${clientZip.hash}`],
                        bytes: parseInt(clientZip.bytes),
                    },
                ],
            },
        ],
    }
}

function run(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(command, (error: any, stdout: string, stderr: string) => {
            if (error) {
                reject(error)
            } else {
                resolve(stdout.trim())
            }
        })
    })
}

;(async () => {
    console.log(`SERVER_VERSION: ${process.env.SERVER_VERSION}`)
    console.log(`RELEASE_ARTIFACTS_PATH: ${process.env.RELEASE_ARTIFACTS_PATH}`)
    console.log(`REPO_URL: ${process.env.REPO_URL}`)
    console.log(`TAG_NAME: ${process.env.TAG_NAME}`)

    if (!process.env.SERVER_VERSION) {
        throw new Error('Missing envvar: SERVER_VERSION')
    }

    if (!process.env.RELEASE_ARTIFACTS_PATH) {
        throw new Error('Missing envvar: RELEASE_ARTIFACTS_PATH')
    }

    if (!process.env.REPO_URL) {
        throw new Error('Missing envvar: REPO_URL')
    }

    if (!process.env.TAG_NAME) {
        throw new Error('Missing envvar: TAG_NAME')
    }

    const releaseArtifactsPath = process.env.RELEASE_ARTIFACTS_PATH
    const manifestPath = path.join(releaseArtifactsPath, 'manifest.json')
    await updateManifest(manifestPath, {
        serverVersion: process.env.SERVER_VERSION,
        releaseArtifactsPath,
        repoUrl: process.env.REPO_URL,
        gitHubReleaseName: process.env.TAG_NAME,
    })
})()
