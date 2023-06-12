import { URI } from 'vscode-uri'
import { ContentRequestMiddleware, ContentRequestMiddlewareDelegate } from './contentRequestMiddleware'
import { SchemaProvider } from './schemaProvider'

/**
 * Creates a middleware pipeline for resolving requests for a schema.
 * Middleware handlers will be called in the order they are added, until a
 * handler returns a response. At this point, the handlers in the call stack
 * have a chance to handle/process the response.
 */
export class SchemaProviderBuilder {
    private readonly handlers: ContentRequestMiddleware[] = []

    public addHandler(handler: ContentRequestMiddleware): SchemaProviderBuilder {
        this.handlers.push(handler)
        return this
    }

    public build(): SchemaProvider {
        let fnNextHandler: ContentRequestMiddlewareDelegate = async (uri: URI) => {
            throw new Error(`Unhandled uri: ${uri.toString()}`)
        }

        this.handlers.reverse().forEach(handler => {
            const fnCurrentHandler = fnNextHandler
            fnNextHandler = (uri: URI) => handler.get(uri, fnCurrentHandler)
        })

        return async (uri: string): Promise<string> => {
            const response = await fnNextHandler(URI.parse(uri))
            return response.content
        }
    }
}
