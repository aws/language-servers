import * as fs from 'fs'
import { homedir } from 'os'
import * as path from 'path'

/** 
 * Represents the directory which all cache resides in for this
 * Language Server
*/
export class LanguageServerCacheDir {
    static get path(): string {
        return path.resolve(path.join(homedir(), '.aws-language-server-cache'))
    }

    /**
     * It is important this is run at the start of the language server
     * so it can always be assumed the directory exists.
     */
    static setup(): undefined {
        fs.mkdirSync(this.path, { recursive: true })
        return
    }
}