import {
    AWSInitializationOptions,
    Logging,
    LSPErrorCodes,
    ResponseError,
} from '@aws/language-server-runtimes/server-interface'
import { isBool, isObject, SsoConnectionType } from '../utils'
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

export const MAX_Q_DEVELOPER_PROFILE_PAGES = 10
const MAX_Q_DEVELOPER_PROFILES_PER_PAGE = 10

export const getListAllAvailableProfilesHandler =
    (service: (region: string, endpoint: string) => CodeWhispererServiceToken): ListAllAvailableProfilesHandler =>
    async ({ connectionType, logging, endpoints }) => {
        if (!connectionType || connectionType !== 'identityCenter') {
            logging.debug('Connection type is not set or not identityCenter - returning empty response.')
            return []
        }

        let allProfiles: AmazonQDeveloperProfile[] = []
        const qEndpoints = endpoints ?? AWS_Q_ENDPOINTS

        const result = await Promise.allSettled(
            Object.entries(qEndpoints).map(([region, endpoint]) => {
                const codeWhispererService = service(region, endpoint)
                return fetchProfilesFromRegion(codeWhispererService, region, logging)
            })
        )

        const fulfilledResults = result.filter(settledResult => settledResult.status === 'fulfilled')

        if (fulfilledResults.length === 0) {
            throw new ResponseError(LSPErrorCodes.RequestFailed, `Failed to retrieve profiles from all queried regions`)
        }

        fulfilledResults.forEach(fulfilledResult => allProfiles.push(...fulfilledResult.value))

        return allProfiles
    }

async function fetchProfilesFromRegion(
    service: CodeWhispererServiceToken,
    region: string,
    logging: Logging
): Promise<AmazonQDeveloperProfile[]> {
    let allRegionalProfiles: AmazonQDeveloperProfile[] = []
    let nextToken: string | undefined = undefined
    let numberOfPages = 0

    try {
        do {
            logging.debug(`Fetching profiles from region: ${region} (iteration: ${numberOfPages})`)

            const response = await service.listAvailableProfiles({
                maxResults: MAX_Q_DEVELOPER_PROFILES_PER_PAGE,
            })

            const profiles = response.profiles.map(profile => ({
                arn: profile.arn,
                name: profile.profileName,
                identityDetails: {
                    region,
                },
            }))

            allRegionalProfiles.push(...profiles)

            nextToken = response.nextToken
            numberOfPages++

            logging.debug(`Fetched profiles from ${region}: ${JSON.stringify(response)} (iteration: ${numberOfPages})`)
        } while (nextToken !== undefined && numberOfPages < MAX_Q_DEVELOPER_PROFILE_PAGES)

        return allRegionalProfiles
    } catch (error) {
        logging.error(`Error fetching profiles from ${region}: ${error}`)

        throw error
    }
}

const AWSQCapabilitiesKey = 'q'
const developerProfilesEnabledKey = 'developerProfiles'

/**
 * @returns true if AWSInitializationOptions has the Q developer profiles flag set explicitly to true
 *
 * @example
 * The function expects to receive the following structure:
 * ```ts
 * {
 *  awsClientCapabilities?: {
 *    q?: {
 *        developerProfiles?: boolean
 *    }
 *  }
 * }
 * ```
 */
export function signalsAWSQDeveloperProfilesEnabled(initializationOptions: AWSInitializationOptions): boolean {
    const qCapibilities = initializationOptions.awsClientCapabilities?.[AWSQCapabilitiesKey]

    if (
        isObject(qCapibilities) &&
        !(qCapibilities instanceof Array) &&
        developerProfilesEnabledKey in qCapibilities &&
        isBool(qCapibilities[developerProfilesEnabledKey])
    ) {
        return qCapibilities[developerProfilesEnabledKey]
    }

    return false
}
