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

        // Log all endpoints we're going to try
        logging.debug(
            `Attempting to fetch profiles from ${qEndpoints.size} endpoints: ${JSON.stringify(Array.from(qEndpoints.entries()))}`
        )

        if (token.isCancellationRequested) {
            return []
        }

        const result = await Promise.allSettled(
            Array.from(qEndpoints.entries(), ([region, endpoint]) => {
                logging.debug(`Creating service client for region: ${region}, endpoint: ${endpoint}`)
                const codeWhispererService = service(region, endpoint)
                return fetchProfilesFromRegion(codeWhispererService, region, endpoint, logging, token)
            })
        )

        if (token.isCancellationRequested) {
            return []
        }

        // Log detailed results from each region
        result.forEach((settledResult, index) => {
            const [region, endpoint] = Array.from(qEndpoints.entries())[index]
            if (settledResult.status === 'fulfilled') {
                const profiles = settledResult.value
                logging.debug(
                    `Successfully fetched ${profiles.length} profiles from region: ${region}, endpoint: ${endpoint}`
                )
            } else {
                logging.error(
                    `Failed to fetch profiles from region: ${region}, endpoint: ${endpoint}, error: ${settledResult.reason?.name || 'unknown'}, message: ${settledResult.reason?.message || 'No message'}`
                )
            }
        })

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

        // Log summary of all profiles fetched
        logging.debug(`Total profiles fetched: ${allProfiles.length}`)
        if (allProfiles.length > 0) {
            logging.debug(`Profile names: ${allProfiles.map(p => p.name).join(', ')}`)
            logging.debug(`Profile regions: ${allProfiles.map(p => p.identityDetails?.region).join(', ')}`)
        }

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
    endpoint: string,
    logging: Logging,
    token: CancellationToken
): Promise<AmazonQDeveloperProfile[]> {
    let allRegionalProfiles: AmazonQDeveloperProfile[] = []
    let nextToken: string | undefined = undefined
    let numberOfPages = 0

    try {
        logging.debug(`Starting profile fetch from region: ${region}, endpoint: ${endpoint}`)

        do {
            logging.debug(
                `Fetching profiles from region: ${region}, endpoint: ${endpoint} (page: ${numberOfPages + 1})`
            )

            if (token.isCancellationRequested) {
                logging.debug(`Cancellation requested during profile fetch from region: ${region}`)
                return allRegionalProfiles
            }

            const requestParams = {
                maxResults: MAX_Q_DEVELOPER_PROFILES_PER_PAGE,
                nextToken: nextToken,
            }
            logging.debug(`Request params for region ${region}: ${JSON.stringify(requestParams)}`)

            const response = await service.listAvailableProfiles(requestParams)

            logging.debug(`Raw response from ${region}: ${JSON.stringify(response)}`)

            const profiles = response.profiles.map(profile => ({
                arn: profile.arn,
                name: profile.profileName,
                identityDetails: {
                    region,
                },
            }))

            logging.debug(`Fetched ${profiles.length} profiles from ${region} (page: ${numberOfPages + 1})`)
            if (profiles.length > 0) {
                logging.debug(`Profile names from ${region}: ${profiles.map(p => p.name).join(', ')}`)
            }

            allRegionalProfiles.push(...profiles)

            nextToken = response.nextToken
            if (nextToken) {
                logging.debug(`Next token received from ${region}: ${nextToken.substring(0, 10)}...`)
            } else {
                logging.debug(`No next token received from ${region}, pagination complete`)
            }

            numberOfPages++
        } while (nextToken !== undefined && numberOfPages < MAX_Q_DEVELOPER_PROFILE_PAGES)

        logging.debug(`Completed fetching profiles from ${region}, total profiles: ${allRegionalProfiles.length}`)
        return allRegionalProfiles
    } catch (error) {
        // Enhanced error logging with more details
        logging.error(`Error fetching profiles from region: ${region}, endpoint: ${endpoint}`)
        logging.error(`Error type: ${error?.constructor?.name || 'Unknown'}`)
        logging.error(`Error name: ${(error as any)?.name || 'Unknown'}`)
        logging.error(`Error message: ${(error as Error)?.message || 'No message'}`)
        logging.error(`Error code: ${(error as any)?.code || 'No code'}`)

        if ((error as any)?.statusCode) {
            logging.error(`HTTP status code: ${(error as any).statusCode}`)
        }

        if ((error as any)?.$metadata) {
            logging.error(`Request metadata: ${JSON.stringify((error as any).$metadata)}`)
        }

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
