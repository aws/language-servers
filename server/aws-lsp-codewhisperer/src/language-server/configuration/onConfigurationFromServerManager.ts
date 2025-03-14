import {
    CredentialsProvider,
    Logging,
    LSPErrorCodes,
    ResponseError,
} from '@aws/language-server-runtimes/server-interface'
import {
    AmazonQDeveloperProfile,
    getListAllAvailableProfilesHandler,
    ListAllAvailableProfilesHandler,
} from '../amazonQServiceManager/qDeveloperProfiles'
import { CodeWhispererServiceToken } from '../codeWhispererService'
import { Customizations } from '../../client/token/codewhispererbearertokenclient'
import { Q_CUSTOMIZATIONS, Q_DEVELOPER_PROFILES } from './constants'

const ON_GET_CONFIGURATION_FROM_SERVER_ERROR_PREFIX = 'Failed to fetch: '

export class OnGetConfigurationFromServerManager {
    private listAllAvailableProfilesHandler: ListAllAvailableProfilesHandler

    constructor(
        private service: CodeWhispererServiceToken,
        private credentialsProvider: CredentialsProvider,
        private logging: Logging,
        serviceFromEndpointAndRegion: (region: string, endpoint: string) => CodeWhispererServiceToken
    ) {
        this.listAllAvailableProfilesHandler = getListAllAvailableProfilesHandler(serviceFromEndpointAndRegion)
    }

    async listAvailableProfiles(): Promise<AmazonQDeveloperProfile[]> {
        try {
            const profiles = await this.listAllAvailableProfilesHandler({
                connectionType: this.credentialsProvider.getConnectionType(),
                logging: this.logging,
            })

            return profiles
        } catch (error) {
            throw this.getResponseError(
                `${ON_GET_CONFIGURATION_FROM_SERVER_ERROR_PREFIX}${Q_DEVELOPER_PROFILES}`,
                error
            )
        }
    }

    async listAvailableCustomizations(): Promise<Customizations> {
        try {
            const customizations = (await this.service.listAvailableCustomizations({ maxResults: 100 })).customizations

            return customizations
        } catch (error) {
            throw this.getResponseError(`${ON_GET_CONFIGURATION_FROM_SERVER_ERROR_PREFIX}${Q_CUSTOMIZATIONS}`, error)
        }
    }

    private getResponseError(message: string, error: any): ResponseError {
        this.logging.error(`${message}: ${error}`)
        return new ResponseError(LSPErrorCodes.RequestFailed, message)
    }
}
