import * as fs from 'fs'
import { promisify } from 'util'
import { URI } from 'vscode-uri'
import {
    ContentRequestMiddleware,
    ContentRequestMiddlewareDelegate,
    ContentRequestResponse,
} from '../contentRequestMiddleware'
const readFile = promisify(fs.readFile)

export class FileHandler implements ContentRequestMiddleware {
    async get(uri: URI, next: ContentRequestMiddlewareDelegate): Promise<ContentRequestResponse> {
        if (uri.scheme !== 'file') {
            // we only know how to handle file requests. Go to the next handler.
            return next(uri)
        }

        return {
            content: await readFile(uri.fsPath, { encoding: 'utf8' }),
        }
    }
}
