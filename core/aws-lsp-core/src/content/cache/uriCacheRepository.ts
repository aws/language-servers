import { createHash } from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import { promisify } from 'util'
import { URI } from 'vscode-uri'
import { TimeProvider } from '../../util/timeProvider'
import { DefaultUriCacheLocation } from './defaultUriCacheLocation'
const readFile = promisify(fs.readFile)
const exists = promisify(fs.exists)
const writeFile = promisify(fs.writeFile)
const mkdir = promisify(fs.mkdir)

/** Represents the `metadata` file structure */
export interface UriCacheMetadata {
    [uri: string]: UriCacheMetadataEntry
}

/** Represents a single Uri entry in `metadata` */
export interface UriCacheMetadataEntry {
    lastUpdated?: number
    contentFileName?: string
    eTag?: string
}

export type ContentMetadata = Omit<UriCacheMetadataEntry, 'contentFileName'>

/**
 * Provides functionality to retrieve the content
 * of a URI. Content is cached locally for efficient
 * repeated reads.
 *
 * The structure of the cache directory looks as follows:
 *
 * {@link cacheDirRoot}'

/**
 * Provides functionality to retrieve the content
 * of a URI. Content is cached locally for efficient
 * repeated reads.
 *
 * The structure of the cache directory looks as follows:
 *
 * {@link cacheDirRoot}/
 * └── cachedUris/
 *     ├── metadata
 *     ├── d8e3b6aadda6a6e9e <- Hashed uri for unique name, holds the actual data
 *     ├── 6a6e9ec3c66bf70fb
 *     └── bd37ce0972ac0351f
 *
 * `metadata` has information about all cached uris.
 *
 * Every other file with a hashed name represents the
 * latest content of a specific uri.
 *
 * `metadata` contains a json entry for each uri that
 * will have information about that uri, including the
 * hashed file name that contains the cached content.
 */
export class UriCacheRepository {
    private cachedUrisDirPath: string
    private cacheMetadataPath: string

    constructor(
        cacheDirRoot: string = DefaultUriCacheLocation.path,
        private readonly time: TimeProvider = new TimeProvider()
    ) {
        this.cachedUrisDirPath = path.join(cacheDirRoot, 'cachedUris')
        this.cacheMetadataPath = path.join(this.cachedUrisDirPath, 'metadata')
    }

    /**
     * Loads metadata for all cached URIs
     */
    private async loadCacheMetadata(): Promise<UriCacheMetadata> {
        await this.ensureCacheDirectoryExists()

        if (!(await exists(this.cacheMetadataPath))) {
            return {}
        }

        return JSON.parse(await readFile(this.cacheMetadataPath, { encoding: 'utf-8' }))
    }

    public async cacheContent(uri: URI, content: string, eTag?: string): Promise<void> {
        const contentFileName = this.hashUri(uri)
        const metadataEntry: UriCacheMetadataEntry = {
            contentFileName: contentFileName,
            eTag,
            lastUpdated: this.time.currentMilliseconds(),
        }

        const allMetadata = await this.loadCacheMetadata()
        // Update URI cache with response data
        allMetadata[uri.toString()] = metadataEntry
        await this.writeContentFileText(contentFileName, content)
        await this.writeMetadata(allMetadata)
    }

    public async getContentETag(uri: URI): Promise<string | undefined> {
        const contentMetadata = await this.getContentMetadata(uri)
        return contentMetadata?.eTag
    }

    public async getContentMetadata(uri: URI): Promise<ContentMetadata | undefined> {
        const cacheMetadata: UriCacheMetadata = await this.loadCacheMetadata()
        return cacheMetadata[uri.toString()]
    }

    /** Sets the last updated time to the current time in the `metadata` file.  */
    public async touchLastUpdatedTime(uri: URI): Promise<void> {
        const cacheMetadata: UriCacheMetadata = await this.loadCacheMetadata()
        cacheMetadata[uri.toString()].lastUpdated = this.time.currentMilliseconds()
        await this.writeMetadata(cacheMetadata)
    }

    /** Updates the 'metadata' file with the given input */
    private async writeMetadata(uriCache: UriCacheMetadata): Promise<void> {
        await this.ensureCacheDirectoryExists()
        await writeFile(this.cacheMetadataPath, JSON.stringify(uriCache))
    }

    public async getContent(uri: URI): Promise<string | undefined> {
        const contentFileName = this.hashUri(uri)
        return this.getContentFileText(contentFileName)
    }

    /** Gets the content of a uri from the cache */
    private async getContentFileText(contentFileName?: string): Promise<string | undefined> {
        if (contentFileName === undefined) {
            return
        }

        await this.ensureCacheDirectoryExists()

        const absolutePath = path.join(this.cachedUrisDirPath, contentFileName)
        if (!(await exists(absolutePath))) {
            return
        }

        return readFile(absolutePath, { encoding: 'utf8' })
    }

    private async writeContentFileText(contentFileName: string, text: string): Promise<void> {
        const absolutePath = path.join(this.cachedUrisDirPath, contentFileName)
        await this.ensureCacheDirectoryExists()
        await writeFile(absolutePath, text)
    }

    private async ensureCacheDirectoryExists(): Promise<void> {
        await mkdir(this.cachedUrisDirPath, { recursive: true })
    }

    private hashUri(uri: URI): string {
        // Used for mapping a uri to a local file cache location
        // This use doesn't require a cryptographically strong hash.
        // Sha1 is being used for speed gains over stronger hash algos, since this can be called in rapid succession.
        return createHash('sha1').update(uri.toString()).digest('hex')
    }
}
