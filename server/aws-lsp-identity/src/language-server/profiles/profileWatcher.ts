import { FSWatcher, watch } from 'fs'
import { SendProfileChanged } from '../../iam/utils'
import { ProfileStore } from './profileService'
import { Observability } from '@aws/lsp-core'
import { getHomeDir } from '@smithy/shared-ini-file-loader'
import { join } from 'path'

// Minimum period between file changes to send updated profile notifications
export const fileDebounceMillis = 500

export class ProfileWatcher implements Disposable {
    private fileWatchers: FSWatcher[] = []
    private debounceTimeout?: NodeJS.Timeout

    constructor(
        private profileStore: ProfileStore,
        private readonly raiseProfileChanged: SendProfileChanged,
        private readonly observability: Observability
    ) {}

    [Symbol.dispose](): void {
        this.unwatch()
    }

    watch(): void {
        if (this.fileWatchers.length > 0) {
            return
        }

        const filepaths = [this.getConfigFilepath(), this.getCredentialsFilepath()]
        for (const filepath of filepaths) {
            this.fileWatchers.push(watch(filepath, { persistent: false }, this.onFileChange.bind(this)))
        }
    }

    unwatch(): void {
        this.fileWatchers.forEach(watcher => watcher.close())
        this.fileWatchers = []
    }

    onFileChange() {
        // Reset the debounce time if this change occurred shortly after previous change
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout)
        }
        // Send profile change notification after debounce time elapses
        this.debounceTimeout = setTimeout(async () => {
            try {
                const response = await this.profileStore.load()
                this.raiseProfileChanged(response)
            } catch (error) {
                this.observability.logging.log(`Error reloading profiles: ${error}`)
            }
        }, fileDebounceMillis)
    }

    private getConfigFilepath(): string {
        const envVar = process.env['AWS_CONFIG_FILE']
        if (envVar) {
            return envVar.startsWith('~/') ? join(getHomeDir(), envVar.substring(2)) : envVar
        }
        return join(getHomeDir(), '.aws', 'config')
    }

    private getCredentialsFilepath(): string {
        const envVar = process.env['AWS_SHARED_CREDENTIALS_FILE']
        if (envVar) {
            return envVar.startsWith('~/') ? join(getHomeDir(), envVar.substring(2)) : envVar
        }
        return join(getHomeDir(), '.aws', 'credentials')
    }
}
