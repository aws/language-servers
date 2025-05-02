import {
    CancellationToken,
    CredentialsProvider,
    GetConfigurationFromServerParams,
    InitializeParams,
    Logging,
    LSPErrorCodes,
    ResponseError,
    Server,
} from '@aws/language-server-runtimes/server-interface'
import {
    AmazonQDeveloperProfile,
    getListAllAvailableProfilesHandler,
    ListAllAvailableProfilesHandler,
} from '../../shared/amazonQServiceManager/qDeveloperProfiles'
import { Customization, Customizations } from '../../client/token/codewhispererbearertokenclient'
import { AmazonQTokenServiceManager } from '../../shared/amazonQServiceManager/AmazonQTokenServiceManager'
import { AWS_Q_ENDPOINTS, Q_CONFIGURATION_SECTION } from '../../shared/constants'
import { AmazonQError } from '../../shared/amazonQServiceManager/errors'

const Q_CUSTOMIZATIONS = 'customizations'
const Q_DEVELOPER_PROFILES = 'developerProfiles'

export const Q_CUSTOMIZATIONS_CONFIGURATION_SECTION = `${Q_CONFIGURATION_SECTION}.${Q_CUSTOMIZATIONS}`
export const Q_DEVELOPER_PROFILES_CONFIGURATION_SECTION = `${Q_CONFIGURATION_SECTION}.${Q_DEVELOPER_PROFILES}`

interface CustomizationWithMetadata extends Customization {
    region?: string
    profileArn?: string
}

interface QConfigurationSections {
    customizations: CustomizationWithMetadata[]
    developerProfiles?: AmazonQDeveloperProfile[]
}

type QConfigurationResponse =
    | QConfigurationSections
    | QConfigurationSections['customizations']
    | QConfigurationSections['developerProfiles']

export const QConfigurationServerToken =
    (): Server =>
    ({ credentialsProvider, lsp, logging }) => {
        let amazonQServiceManager: AmazonQTokenServiceManager
        let serverConfigurationProvider: ServerConfigurationProvider

        lsp.addInitializer((params: InitializeParams) => {
            return {
                capabilities: {},
                awsServerCapabilities: {
                    configurationProvider: {
                        sections: [
                            Q_CONFIGURATION_SECTION,
                            Q_CUSTOMIZATIONS_CONFIGURATION_SECTION,
                            Q_DEVELOPER_PROFILES_CONFIGURATION_SECTION,
                        ],
                    },
                },
            }
        })

        lsp.onInitialized(async () => {
            amazonQServiceManager = AmazonQTokenServiceManager.getInstance()

            serverConfigurationProvider = new ServerConfigurationProvider(
                amazonQServiceManager,
                credentialsProvider,
                logging
            )
        })

        lsp.extensions.onGetConfigurationFromServer(
            async (
                params: GetConfigurationFromServerParams,
                token: CancellationToken
            ): Promise<QConfigurationResponse | void> => {
                const section = params.section

                let customizations: Customizations
                let developerProfiles: AmazonQDeveloperProfile[]

                try {
                    switch (section) {
                        case Q_CONFIGURATION_SECTION:
                            ;[customizations, developerProfiles] = await Promise.all([
                                serverConfigurationProvider.listAvailableCustomizations(),
                                serverConfigurationProvider.listAvailableProfiles(token),
                            ])

                            throwIfCancelled(token)

                            return amazonQServiceManager.getEnableDeveloperProfileSupport()
                                ? { customizations, developerProfiles }
                                : { customizations }
                        case Q_CUSTOMIZATIONS_CONFIGURATION_SECTION:
                            customizations = await serverConfigurationProvider.listAvailableCustomizations()

                            return customizations
                        case Q_DEVELOPER_PROFILES_CONFIGURATION_SECTION:
                            developerProfiles = await serverConfigurationProvider.listAvailableProfiles(token)

                            throwIfCancelled(token)

                            return developerProfiles
                        default:
                            break
                    }
                } catch (error) {
                    if (error instanceof ResponseError) {
                        throw error
                    }

                    logging.error(`Failed to fetch resources for section ${section}: ${error}`)
                    throw new ResponseError(
                        LSPErrorCodes.RequestFailed,
                        `An unexpected error occured while fetching resource(s) for section: ${section}`
                    )
                }
            }
        )

        logging.log('Amazon Q Configuration server has been initialised')
        return () => {}
    }

function throwIfCancelled(token: CancellationToken) {
    if (token.isCancellationRequested) {
        throw new ResponseError(LSPErrorCodes.RequestCancelled, 'Request cancelled')
    }
}

const ON_GET_CONFIGURATION_FROM_SERVER_ERROR_PREFIX = 'Failed to fetch: '

export class ServerConfigurationProvider {
    private listAllAvailableProfilesHandler: ListAllAvailableProfilesHandler

    constructor(
        private serviceManager: AmazonQTokenServiceManager,
        private credentialsProvider: CredentialsProvider,
        private logging: Logging
    ) {
        this.listAllAvailableProfilesHandler = getListAllAvailableProfilesHandler(
            this.serviceManager.getServiceFactory()
        )
    }

    async listAvailableProfiles(token: CancellationToken): Promise<AmazonQDeveloperProfile[]> {
        if (!this.serviceManager.getEnableDeveloperProfileSupport()) {
            this.logging.debug('Q developer profiles disabled - returning empty list')
            return []
        }

        try {
            const profiles = await this.listAllAvailableProfilesHandler({
                connectionType: this.credentialsProvider.getConnectionType(),
                logging: this.logging,
                token: token,
            })

            return profiles
        } catch (error) {
            if (error instanceof AmazonQError) {
                this.logging.error(error.message)
                throw new ResponseError(
                    LSPErrorCodes.RequestFailed,
                    `${ON_GET_CONFIGURATION_FROM_SERVER_ERROR_PREFIX}${Q_DEVELOPER_PROFILES}`,
                    {
                        awsErrorCode: error.code,
                    }
                )
            }
            throw this.getResponseError(
                `${ON_GET_CONFIGURATION_FROM_SERVER_ERROR_PREFIX}${Q_DEVELOPER_PROFILES}`,
                error
            )
        }
    }

    async listAvailableCustomizations(): Promise<Customizations> {
        try {
            const customizations = (
                await this.serviceManager.getCodewhispererService().listAvailableCustomizations({ maxResults: 100 })
            ).customizations

            return customizations
        } catch (error) {
            throw this.getResponseError(`${ON_GET_CONFIGURATION_FROM_SERVER_ERROR_PREFIX}${Q_CUSTOMIZATIONS}`, error)
        }
    }

    async listAvailableCustomizationsForProfileAndRegion(profileArn: string, region: string): Promise<Customizations> {
        try {
            // Create a new service for the specific region
            const service = this.serviceManager.getServiceFactory()(region, AWS_Q_ENDPOINTS.get(region) || '')
            service.profileArn = profileArn

            const customizations = (await service.listAvailableCustomizations({ maxResults: 100 })).customizations

            return customizations
        } catch (error) {
            throw this.getResponseError(`${ON_GET_CONFIGURATION_FROM_SERVER_ERROR_PREFIX}${Q_CUSTOMIZATIONS}`, error)
        }
    }

    async listAllAvailableCustomizationsWithMetadata(token: CancellationToken): Promise<CustomizationWithMetadata[]> {
        try {
            // First fetch all available profiles
            const profiles = await this.listAllAvailableProfilesHandler({
                connectionType: this.credentialsProvider.getConnectionType(),
                logging: this.logging,
                token: token,
            })

            if (token.isCancellationRequested) {
                throw new ResponseError(LSPErrorCodes.RequestCancelled, 'Request cancelled')
            }

            // Initialize result array
            const allCustomizations: CustomizationWithMetadata[] = []

            // For each profile, fetch customizations
            for (const profile of profiles) {
                if (token.isCancellationRequested) {
                    throw new ResponseError(LSPErrorCodes.RequestCancelled, 'Request cancelled')
                }

                const region = profile.identityDetails?.region
                if (!region) {
                    continue
                }

                try {
                    const customizations = await this.listAvailableCustomizationsForProfileAndRegion(
                        profile.arn,
                        region
                    )

                    // Add metadata to each customization
                    const customizationsWithMetadata = customizations.map(customization => ({
                        ...customization,
                        region,
                        profileArn: profile.arn,
                    }))

                    allCustomizations.push(...customizationsWithMetadata)
                } catch (error) {
                    this.logging.error(
                        `Failed to fetch customizations for profile ${profile.arn} in region ${region}: ${error}`
                    )
                    // Continue with other profiles even if one fails
                }
            }

            return allCustomizations
        } catch (error) {
            if (error instanceof ResponseError) {
                throw error
            }
            throw this.getResponseError(`Failed to fetch customizations with metadata`, error)
        }
    }

    private getResponseError(message: string, error: any): ResponseError {
        this.logging.error(`${message}: ${error}`)
        return new ResponseError(LSPErrorCodes.RequestFailed, message)
    }
}
