import { homedir } from 'os'
import * as path from 'path'

/**
 * Represents the directory which all cache resides in for this
 * Language Server
 */
export class DefaultUriCacheLocation {
    static get path(): string {
        return path.resolve(path.join(homedir(), '.aws-language-server-cache'))
    }
}
