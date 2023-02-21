
import { createHash } from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import { URI } from 'vscode-uri'
import { LanguageServerCacheDir } from '../configurationDirectory'
import { Time } from '../datetime'
import { DefaultHttpRequester, getETag, HttpRequester, HttpRequestHeaders, HttpResponse } from '../http/request'


/** Represents the `metadata` file structure */
interface UriCacheMetadata {
    [uri: string]: UriCacheMetadataEntry
}

/** Represents a single Uri entry in `metadata` */
interface UriCacheMetadataEntry {
    lastUpdated?: number
    contentFileName?: string
    eTag?: string
}

export class UriContentResolver {
    constructor(private readonly fileUriContentResolver = new FileUriContentResolver(),
        private readonly cachedUriContentResolver = new CachedUriContentResolver(),
        private readonly httpUriContentResolver = new HttpUriContentResolver()) { }

    async getContent(uri: URI, useCache = true) {
        let content: string | undefined
        if (uri.scheme.startsWith('file')) {
            content = this.fileUriContentResolver.getContent(uri)
        }
        else if (uri.scheme.startsWith('http')) {
            if (useCache) {
                content = await this.cachedUriContentResolver.getContent(uri)
            }
            else {
                content = (await this.httpUriContentResolver.getContent(uri)).content
            }
        }

        if (content === undefined) {
            throw new Error(`Could not resolve content for: ${uri.toString()}`)
        }

        return content
    }
}

class FileUriContentResolver {
    getContent(uri: URI): string | undefined {
        if (!(uri.scheme == 'file')) {
            return undefined
        }
        return fs.readFileSync(uri.fsPath, { encoding: "utf8" })
    }
}

/**
 * Provides functionality to retrieve the content
 * of a URI. Content is cached locally for efficient
 * repeated reads.
 * 
 * Cache is considered stale after {@link thirtyMinutesInMillis}
 * and is refreshed.
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
export class CachedUriContentResolver {
    private static readonly thirtyMinutesInMillis = 60 * 30 * 1000
    static readonly timeoutPeriodInMillis = CachedUriContentResolver.thirtyMinutesInMillis

    private cachedUrisDirPath: string
    private cacheMetadataPath: string

    constructor(
        cacheDirRoot: string = LanguageServerCacheDir.path,
        private readonly httpContentDownloader: HttpUriContentResolver = new HttpUriContentResolver(),
        private readonly time: Time = new Time()
    ) {
        // Setup uri cache directory
        this.cachedUrisDirPath = path.join(cacheDirRoot, 'cachedUris')
        fs.mkdirSync(this.cachedUrisDirPath, { recursive: true })

        // Setup cache metadata file
        this.cacheMetadataPath = path.join(this.cachedUrisDirPath, 'metadata')
        if (!fs.existsSync(this.cacheMetadataPath)) {
            fs.writeFileSync(this.cacheMetadataPath, "{}")
        }
    }

    async getContent(uri: URI): Promise<string> {
        if (!uri.scheme.startsWith('http')) {
            throw Error(`Non-http schemed URIs not supported: ${uri.toString()}`)
        }

        const uriAsString = uri.toString()
        const allMetadata: UriCacheMetadata = this.getAllMetadata()

        // Get cached data for current URI
        const cachedMetadataEntry: UriCacheMetadataEntry | undefined = allMetadata[uriAsString]
        const cachedContentFileName = cachedMetadataEntry?.contentFileName
        const cachedContent = this.getContentFileText(cachedContentFileName)
        const cachedETag = cachedMetadataEntry?.eTag
        const cachedLastUpdated = cachedMetadataEntry?.lastUpdated

        let eTagToRequest: string | undefined = undefined

        if (cachedContent !== undefined) {
            if (!this.isCacheTimeout(cachedLastUpdated)) {
                // We have valid cached content that has not timed out yet.
                return cachedContent
            }
            eTagToRequest = cachedETag
        }

        const response = await this.httpContentDownloader.getContent(uri, eTagToRequest)

        // Collect required data from response
        const responseContent = response.content
        const responseETag = response.eTag

        // ETag request cache hit, use our existing cache.
        if (responseContent === undefined) {
            this.updateLastUpdatedTime(allMetadata, uri)

            if (cachedContent === undefined) {
                throw new Error(`ETag match, but no cached content: ${uriAsString}`)
            }
            return cachedContent
        }

        this.cacheContent(uri, responseContent, responseETag)

        return responseContent
    }

    private getAllMetadata(): UriCacheMetadata {
        return JSON.parse(fs.readFileSync(this.cacheMetadataPath, { encoding: 'utf-8' }))
    }

    private cacheContent(uri: URI, content: string, eTag?: string): void {
        const contentFileName = this.hashUri(uri)
        const metadataEntry: UriCacheMetadataEntry = {
            contentFileName: contentFileName,
            eTag,
            lastUpdated: this.time.inMilliseconds()
        }

        const allMetadata = this.getAllMetadata()
        // Update URI cache with response data
        allMetadata[uri.toString()] = metadataEntry
        this.writeMetadata(allMetadata)
        this.writeContentFileText(contentFileName, content)
    }

    getETag(uri: URI): string | undefined {
        const allMetadata: UriCacheMetadata = JSON.parse(fs.readFileSync(this.cacheMetadataPath, { encoding: 'utf-8' }))
        return allMetadata[uri.toString()]?.eTag
    }

    /** Sets the last updated time to the current time in the `metadata` file.  */
    private updateLastUpdatedTime(uriCache: UriCacheMetadata, uri: URI): void {
        uriCache[uri.toString()].lastUpdated = this.time.inMilliseconds()
        this.writeMetadata(uriCache)
    }

    /** Checks if the cache has timed out using the last updated time. */
    private isCacheTimeout(lastUpdated?: number): boolean {
        if (lastUpdated === undefined) {
            return true
        }

        const diff = this.time.inMilliseconds() - lastUpdated
        return (diff) > CachedUriContentResolver.thirtyMinutesInMillis
    }

    /** Updates the 'metadata' file with the given input */
    private writeMetadata(uriCache: UriCacheMetadata): void {
        fs.writeFileSync(this.cacheMetadataPath, JSON.stringify(uriCache))
    }

    /** Gets the content of a uri from the cache */
    private getContentFileText(contentFileName?: string): string | undefined {
        if (contentFileName === undefined) {
            return
        }

        const absolutePath = path.join(this.cachedUrisDirPath, contentFileName)
        if (!fs.existsSync(absolutePath)) {
            return
        }

        return fs.readFileSync(absolutePath, { encoding: "utf8" })
    }

    private writeContentFileText(contentFileName: string, text: string): void {
        const absolutePath = path.join(this.cachedUrisDirPath, contentFileName)
        fs.writeFileSync(absolutePath, text)
        return
    }

    private hashUri(uri: URI): string {
        return createHash('sha256').update(uri.toString()).digest('hex')
    }
}

export class HttpUriContentResolver {

    constructor(
        readonly httpContentDownloader: HttpRequester = new DefaultHttpRequester(),
    ) { }

    /**
     * Downloads the content of a HTTP uri.
     * 
     * Additionally if an eTag is provided it will use it in the request.
     * In the scenario the eTag matches the destinations, the content
     * returned will be undefined.
     * 
     * In any other scenario an error will be thrown.
     * @param uri 
     * @param eTag 
     * @returns text content and eTag if it exists, on undefined content it is an eTag match
     */
    async getContent(uri: URI, eTag?: string): Promise<{ content: string | undefined, eTag: string | undefined }> {
        if (!uri.scheme.startsWith('http')) {
            throw new Error(`Only uri with http(s) scheme is supported, but was: ${uri.toString()}`)
        }

        let headers: HttpRequestHeaders = {}

        if (eTag !== undefined) {
            // 'If-None-Match' Header induces 304 status if ETag value matches the remote's.
            // See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag
            headers = { 'If-None-Match': eTag }
        }

        // Request uri data
        let response: HttpResponse
        let latestETag: string
        try {
            response = await this.httpContentDownloader.request(uri.toString(), { headers })
            latestETag = getETag(response.headers)
        }
        catch (err) {
            if ((err as HttpResponse).status == 304) {
                // The current http request library throws an error on,
                // I'm assuming non 200 status codes, so we need to catch this
                // case. If we can disable the exception this try/catch can be removed.

                // Requested data matches our cache.
                return { content: undefined, eTag }
            }
            throw err
        }
        return { content: response.responseText, eTag: latestETag }
    }

}