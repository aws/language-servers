import { Headers, xhr, XHROptions, XHRResponse } from 'request-light'

// Abstract away interfaces of existing implementations
export type HttpRequestOptions = Pick<XHROptions, 'headers' | 'type'>
export type HttpRequestHeaders = Headers
export type HttpResponse = XHRResponse

export interface HttpRequester {
    request(url: string, options?: HttpRequestOptions): Promise<HttpResponse>
}
/**
 * Abstracted http request class.
 *
 * This will ensure we are not locked in to a specific
 * http request implementation.
 */
export class DefaultHttpRequester implements HttpRequester {
    constructor(private readonly requestImpl = xhr) {}

    /** Sends a http request */
    request(url: string, options: HttpRequestOptions = {}): Promise<HttpResponse> {
        return this.requestImpl({ url, ...options })
    }
}

export function getETag(headers: HttpRequestHeaders): string {
    return (headers.eTag as string) ?? (headers.ETag as string) ?? (headers.etag as string)
}
