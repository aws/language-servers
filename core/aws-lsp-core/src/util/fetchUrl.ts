/**
 * Provides a unified way to fetch content from URLs with different protocols (http, https, file)
 * in a way that's compatible with both Node.js and browser environments.
 */

import * as http from 'http'
import * as https from 'https'
import { URL } from 'url'
import { Workspace } from '@aws/language-server-runtimes/server-interface'

/**
 * Options for fetchUrl
 */
export interface FetchUrlOptions {
    /**
     * Timeout in milliseconds
     */
    timeout?: number

    /**
     * Whether to follow redirects
     */
    followRedirects?: boolean

    /**
     * Maximum number of redirects to follow
     */
    maxRedirects?: number
}

/**
 * Response from fetchUrl
 */
export interface FetchUrlResponse {
    /**
     * The response body as a string
     */
    body: string

    /**
     * HTTP status code (for http/https URLs)
     */
    statusCode?: number

    /**
     * Response headers (for http/https URLs)
     */
    headers?: Record<string, string | string[] | undefined>
}

/**
 * Fetches content from a URL, supporting http, https, and file protocols.
 * Uses Workspace.fs for file URLs to maintain compatibility with both Node.js and browser environments.
 *
 * @param url The URL to fetch from (http://, https://, or file://)
 * @param workspace The Workspace instance for file operations
 * @param options Optional configuration for the fetch operation
 * @returns A promise that resolves to the fetch response
 * @throws Error if the protocol is unsupported or if the fetch operation fails
 */
export async function fetchUrl(
    url: string,
    workspace: Workspace,
    options: FetchUrlOptions = {}
): Promise<FetchUrlResponse> {
    const parsedUrl = new URL(url)

    if (parsedUrl.protocol === 'file:') {
        return fetchFromFileSystem(parsedUrl, workspace)
    } else if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
        return fetchFromHttp(parsedUrl, options)
    } else {
        throw new Error(`Unsupported protocol: ${parsedUrl.protocol}`)
    }
}

/**
 * Fetches content from the file system using Workspace.fs
 */
async function fetchFromFileSystem(parsedUrl: URL, workspace: Workspace): Promise<FetchUrlResponse> {
    try {
        // Extract the file path from the URL
        let filePath = parsedUrl.pathname

        // On Windows, file URLs might have an extra leading slash that needs to be removed
        if (process.platform === 'win32') {
            filePath = filePath.replace(/^\//, '')
        }

        // Check if the file exists
        const exists = await workspace.fs.exists(filePath)
        if (!exists) {
            throw new Error(`File not found: ${filePath}`)
        }

        // Read the file content
        const content = await workspace.fs.readFile(filePath)

        return {
            body: content,
        }
    } catch (error) {
        throw new Error(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`)
    }
}

/**
 * Fetches content from HTTP/HTTPS URLs
 */
async function fetchFromHttp(parsedUrl: URL, options: FetchUrlOptions): Promise<FetchUrlResponse> {
    return new Promise((resolve, reject) => {
        const requestModule = parsedUrl.protocol === 'https:' ? https : http

        const requestOptions: http.RequestOptions = {
            method: 'GET',
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? '443' : '80'),
            path: parsedUrl.pathname + parsedUrl.search,
            timeout: options.timeout,
        }

        const req = requestModule.request(requestOptions, res => {
            // Handle redirects if enabled
            if (
                options.followRedirects !== false &&
                (res.statusCode === 301 ||
                    res.statusCode === 302 ||
                    res.statusCode === 307 ||
                    res.statusCode === 308) &&
                res.headers.location
            ) {
                if (!options.maxRedirects || (options.maxRedirects && options.maxRedirects > 0)) {
                    const redirectOptions = { ...options }
                    if (options.maxRedirects) {
                        redirectOptions.maxRedirects = options.maxRedirects - 1
                    }

                    // Resolve relative URLs
                    const redirectUrl = new URL(res.headers.location, parsedUrl.href).href

                    // Follow the redirect
                    fetchUrl(redirectUrl, {} as Workspace, redirectOptions)
                        .then(resolve)
                        .catch(reject)
                    return
                }
            }

            // Convert headers to a simple object
            const headers: Record<string, string | string[] | undefined> = {}
            Object.entries(res.headers).forEach(([key, value]) => {
                headers[key] = value
            })

            const chunks: Buffer[] = []
            res.on('data', chunk => chunks.push(chunk))
            res.on('end', () => {
                const body = Buffer.concat(chunks).toString('utf-8')
                resolve({
                    body,
                    statusCode: res.statusCode,
                    headers,
                })
            })
        })

        req.on('error', error => {
            reject(new Error(`HTTP request failed: ${error.message}`))
        })

        if (options.timeout) {
            req.on('timeout', () => {
                req.destroy()
                reject(new Error(`Request timed out after ${options.timeout}ms`))
            })
        }

        req.end()
    })
}
