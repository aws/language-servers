import { URI } from 'vscode-uri'
import { DefaultHttpRequester, HttpRequester, getETag } from '../../http/requesters'
import {
    ContentRequestMiddleware,
    ContentRequestMiddlewareDelegate,
    ContentRequestResponse,
} from '../contentRequestMiddleware'

export class HttpHandler implements ContentRequestMiddleware {
    constructor(readonly httpContentDownloader: HttpRequester = new DefaultHttpRequester()) {}

    /**
     * Downloads the content of a HTTP uri. Delegates to the next handler for all other uris.
     *
     * @param uri The uri to get content from
     * @param next If this implementation is unable to handle the request, it calls the delegate for the next
     *              handler in the pipeline. The results from next are immediately returned.
     * @returns loaded content
     */
    async get(uri: URI, next: ContentRequestMiddlewareDelegate): Promise<ContentRequestResponse> {
        if (!uri.scheme.startsWith('http')) {
            // we only know how to handle http(s) requests. Go to the next handler.
            return next(uri)
        }

        const response = await this.httpContentDownloader.request(uri.toString(), {})
        const latestETag = getETag(response.headers)
        return { content: response.responseText, eTag: latestETag }
    }
}
