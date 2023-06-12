import { URI } from 'vscode-uri'

/**
 * Middleware pipeline handler for requesting content.
 * Handlers are chained together so that a content requestor makes a single request call.
 *
 * Implementations have no knowledge of the calling pipeline, or of what other handlers are in the pipeline.
 * An implementation may perform pre-processing on the request, and then call the delegate.
 * An implementation may perform post-processing on the result returned by a delegate.
 * If an implementation is capable of handling the request, it may return the result without calling the delegate.
 */
export interface ContentRequestMiddleware {
    /**
     * Returns content for a URI, delegating down the pipeline if necessary.
     *
     * Implementations generally should not throw. When an incompatible scenario is detected, the next delegate should be called instead.
     *
     * @param uri The uri to get content from
     * @param next If this implementation is unable to handle the request, it calls the delegate for the next
     *              handler in the pipeline. The results from next are typically returned, but may be
     *              processed further by an implementation.
     */
    get(uri: URI, next: ContentRequestMiddlewareDelegate): Promise<ContentRequestResponse>
}

/**
 * Defines the signature for calling the next handler in the pipeline.
 */
export type ContentRequestMiddlewareDelegate = {
    (uri: URI): Promise<ContentRequestResponse>
}

/**
 * The content request response
 */
export interface ContentRequestResponse {
    content: string
    eTag?: string
}
