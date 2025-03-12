import { Logging } from '@aws/language-server-runtimes/server-interface'
import { SsoConnectionType } from '../utils'
import { AWS_Q_ENDPOINTS } from '../../constants'
import { CodeWhispererServiceToken } from '../codeWhispererService'

export interface AmazonQDeveloperProfile {
    arn: string
    name: string
    identityDetails?: IdentityDetails
}

interface IdentityDetails {
    region: string
}

export interface ListAllAvailableProfilesHandlerParams {
    connectionType: SsoConnectionType
    logging: Logging
    endpoints?: { [region: string]: string } // override option for flexibility, we default to all (AWS_Q_ENDPOINTS)
}

export type ListAllAvailableProfilesHandler = (
    params: ListAllAvailableProfilesHandlerParams
) => Promise<AmazonQDeveloperProfile[]>

const MAX_Q_DEVELOPER_PROFILES = 10

export const getListAllAvailableProfilesHandler =
    (service: (region: string, endpoint: string) => CodeWhispererServiceToken): ListAllAvailableProfilesHandler =>
    async ({ connectionType, logging, endpoints }) => {
        if (!connectionType || connectionType !== 'identityCenter') {
            logging.debug('Connection type is not set or not identityCenter - returning empty response.')
            return []
        }

        const allProfiles: AmazonQDeveloperProfile[] = []
        const qEndpoints = endpoints ?? AWS_Q_ENDPOINTS

        try {
            for (const [region, endpoint] of Object.entries(qEndpoints)) {
                try {
                    logging.debug(`Fetching profiles from region: ${region} and endpoint: ${endpoint}`)

                    const codeWhispererService = service(region, endpoint)

                    const response = await codeWhispererService.listAvailableProfiles({
                        maxResults: MAX_Q_DEVELOPER_PROFILES,
                    })

                    if (response) {
                        const profiles = response.profiles.map(profile => ({
                            arn: profile.arn,
                            name: profile.profileName,
                            identityDetails: {
                                region,
                            },
                        }))

                        allProfiles.push(...profiles)
                    }

                    logging.debug(`Fetched profiles from ${region}: ${JSON.stringify(response)}`)
                } catch (error) {
                    logging.error(`Error fetching profiles from ${region}: ${error}`)
                }
            }
            return allProfiles
        } catch (error) {
            logging.error(`Failed to list all profiles: ${error}`)
            throw error
        }
    }
