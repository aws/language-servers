import {
    AWSInitializationOptions,
    CancellationToken,
    Logging,
    LSPErrorCodes,
    ResponseError,
} from '@aws/language-server-runtimes/server-interface'
import { isBool, isObject, SsoConnectionType } from '../utils'
import { AWS_Q_ENDPOINTS } from '../../shared/constants'
import { CodeWhispererServiceToken } from '../codeWhispererService'
import { AmazonQServiceProfileThrottlingError } from './errors'

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
    endpoints?: Map<string, string> // override option for flexibility, we default to all (AWS_Q_ENDPOINTS)
    token: CancellationToken
}

export type ListAllAvailableProfilesHandler = (
    params: ListAllAvailableProfilesHandlerParams
) => Promise<AmazonQDeveloperProfile[]>

export const MAX_Q_DEVELOPER_PROFILE_PAGES = 10
const MAX_Q_DEVELOPER_PROFILES_PER_PAGE = 10

export const getListAllAvailableProfilesHandler =
    (service: (region: string, endpoint: string) => CodeWhispererServiceToken): ListAllAvailableProfilesHandler =>
    async ({ connectionType, logging, endpoints, token }): Promise<AmazonQDeveloperProfile[]> => {
        if (!connectionType || connectionType !== 'identityCenter') {
            logging.debug('Connection type is not set or not identityCenter - returning empty response.')
            return []
        }

        let allProfiles: AmazonQDeveloperProfile[] = []
        const qEndpoints = endpoints ?? AWS_Q_ENDPOINTS

        if (token.isCancellationRequested) {
            return []
        }

        const result = await Promise.allSettled(
            Array.from(qEndpoints.entries(), ([region, endpoint]) => {
                const codeWhispererService = service(region, endpoint)
                return fetchProfilesFromRegion(codeWhispererService, region, logging, token)
            })
        )

        if (token.isCancellationRequested) {
            return []
        }

        const fulfilledResults = result.filter(settledResult => settledResult.status === 'fulfilled')
        const hasThrottlingError = result.some(
            re => re.status === `rejected` && re.reason?.name == `ThrottlingException`
        )
        const throttlingErrorMessage = 'Request was throttled while retrieving profiles'

        // Handle case when no successful results
        if (fulfilledResults.length === 0) {
            if (hasThrottlingError) {
                logging.error(throttlingErrorMessage)
                throw new AmazonQServiceProfileThrottlingError(throttlingErrorMessage)
            }
            throw new ResponseError(LSPErrorCodes.RequestFailed, `Failed to retrieve profiles from all queried regions`)
        }

        fulfilledResults.forEach(fulfilledResult => allProfiles.push(...fulfilledResult.value))

        // Check for partial throttling
        if (hasThrottlingError && allProfiles.length == 0) {
            logging.error(throttlingErrorMessage)
            throw new AmazonQServiceProfileThrottlingError(throttlingErrorMessage)
        }

        return allProfiles
    }

async function fetchProfilesFromRegion(
    service: CodeWhispererServiceToken,
    region: string,
    logging: Logging,
    token: CancellationToken
): Promise<AmazonQDeveloperProfile[]> {
    let allRegionalProfiles: AmazonQDeveloperProfile[] = []
    let nextToken: string | undefined = undefined
    let numberOfPages = 0

    try {
        do {
            logging.debug(`Fetching profiles from region: ${region} (iteration: ${numberOfPages})`)

            if (token.isCancellationRequested) {
                return allRegionalProfiles
            }

            const response = await service.listAvailableProfiles({
                maxResults: MAX_Q_DEVELOPER_PROFILES_PER_PAGE,
                nextToken: nextToken,
            })

            const profiles = response.profiles.map(profile => ({
                arn: profile.arn,
                name: profile.profileName,
                identityDetails: {
                    region,
                },
            }))

            allRegionalProfiles.push(...profiles)

            logging.debug(`Fetched profiles from ${region}: ${JSON.stringify(response)} (iteration: ${numberOfPages})`)
            nextToken = response.nextToken
            numberOfPages++
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
    const qCapabilities = initializationOptions.awsClientCapabilities?.[AWSQCapabilitiesKey]

    if (
        isObject(qCapabilities) &&
        !(qCapabilities instanceof Array) &&
        developerProfilesEnabledKey in qCapabilities &&
        isBool(qCapabilities[developerProfilesEnabledKey])
    ) {
        return qCapabilities[developerProfilesEnabledKey]
    }

    return false
}
