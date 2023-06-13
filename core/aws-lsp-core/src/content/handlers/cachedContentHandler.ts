import { URI } from 'vscode-uri'
import { DefaultHttpRequester, HttpRequester, getETag } from '../../http/requesters'
import { TimeProvider } from '../../util/timeProvider'
import { ContentMetadata, UriCacheRepository } from '../cache/uriCacheRepository'
import {
    ContentRequestMiddleware,
    ContentRequestMiddlewareDelegate,
    ContentRequestResponse,
} from '../contentRequestMiddleware'

export interface CachedContentHandlerProps {
    cacheRepository: UriCacheRepository
    httpRequester?: HttpRequester
    timeProvider?: TimeProvider
}

/**
 * Middleware that will use a cached version of content if the online version has not been updated.
 * Newer content that has been downloaded will be cached.
 *
 * This avoids unnecessary downloads.
 *
 * Cached content is considered stale after {@link thirtyMinutesInMillis}
 * and is refreshed.
 */
export class CachedContentHandler implements ContentRequestMiddleware {
    private static readonly thirtyMinutesInMillis = 60 * 30 * 1000
    public static readonly timeoutPeriodInMillis = CachedContentHandler.thirtyMinutesInMillis

    private readonly cacheRepository: UriCacheRepository
    private readonly httpRequester: HttpRequester
    private readonly timeProvider: TimeProvider

    constructor({
        cacheRepository,
        httpRequester = new DefaultHttpRequester(),
        timeProvider = new TimeProvider(),
    }: CachedContentHandlerProps) {
        this.cacheRepository = cacheRepository
        this.httpRequester = httpRequester
        this.timeProvider = timeProvider
    }

    async get(uri: URI, next: ContentRequestMiddlewareDelegate): Promise<ContentRequestResponse> {
        if (!uri.scheme.startsWith('http')) {
            // we're only caching from online sources
            return next(uri)
        }

        const cachedMetadata = await this.cacheRepository.getContentMetadata(uri)
        const currentETag = await this.getETag(uri)

        if (this.isCacheStale(cachedMetadata) === false && cachedMetadata!.eTag === currentETag) {
            // Our cached content matches the online content, and is valid for use
            const content = await this.cacheRepository.getContent(uri)

            // fall through if we were unable to load content (eg: file doesn't exist)
            if (content!!) {
                return {
                    content: content,
                    eTag: cachedMetadata!.eTag,
                }
            }
        }

        // load content, then cache it
        const content = await next(uri)

        await this.cacheRepository.cacheContent(uri, content.content, content.eTag)

        return content
    }

    private async getETag(uri: URI): Promise<string | undefined> {
        const response = await this.httpRequester.request(uri.toString(), {
            type: 'HEAD',
        })

        return getETag(response.headers)
    }

    /** Checks if the cache has timed out using the last updated time. */
    private isCacheStale(contentMetadata: ContentMetadata | undefined): boolean {
        if (contentMetadata?.lastUpdated === undefined) {
            return true
        }

        const diff = this.timeProvider.currentMilliseconds() - contentMetadata.lastUpdated
        return diff > CachedContentHandler.timeoutPeriodInMillis
    }
}
