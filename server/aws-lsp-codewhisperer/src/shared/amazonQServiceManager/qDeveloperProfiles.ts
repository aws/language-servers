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
            logging.debug(
                `Q Developer Profile Search: Connection type '${connectionType}' is not supported. Only 'identityCenter' connections can access Q Developer profiles - returning empty response.`
            )
            return []
        }

        let allProfiles: AmazonQDeveloperProfile[] = []
        const qEndpoints = endpoints ?? AWS_Q_ENDPOINTS

        logging.log(`Q Developer Profile Discovery: Starting search across ${qEndpoints.size} regions`)
        logging.log(`Q Developer Profile Discovery: Regions to search: ${Array.from(qEndpoints.keys()).join(', ')}`)
        qEndpoints.forEach((endpoint, region) => {
            logging.log(`Q Developer Profile Discovery: ${region} endpoint: ${endpoint}`)
        })

        if (token.isCancellationRequested) {
            return []
        }

        const result = await Promise.allSettled(
            Array.from(qEndpoints.entries(), ([region, endpoint]) => {
                logging.log(
                    `Q Developer Profile Discovery: Setting up CodeWhisperer service client for ${region} (${endpoint})`
                )
                const codeWhispererService = service(region, endpoint)
                return fetchProfilesFromRegion(codeWhispererService, region, logging, token)
            })
        )

        if (token.isCancellationRequested) {
            return []
        }

        logging.log(`Q Developer Profile Discovery: Search results summary:`)
        try {
            result.forEach((settledResult, index) => {
                const [region, endpoint] = Array.from(qEndpoints.entries())[index]
                if (settledResult.status === 'fulfilled') {
                    const profiles = settledResult.value
                    logging.log(`Q Developer Profile Discovery: SUCCESS ${region}: Found ${profiles.length} profile(s)`)
                    if (profiles.length > 0) {
                        profiles.forEach(profile => {
                            logging.log(
                                `Q Developer Profile Discovery: Profile found - Name: ${profile.name}, ARN: ${profile.arn}`
                            )
                        })
                    }
                } else {
                    const error = settledResult.reason
                    logging.log(`Q Developer Profile Discovery: FAILED ${region}: ${error?.name || 'Unknown Error'}`)
                    logging.log(
                        `Q Developer Profile Discovery: Error details - ${error?.message || 'No error message'}`
                    )
                    if (error?.statusCode) {
                        logging.log(`Q Developer Profile Discovery: HTTP Status Code: ${error.statusCode}`)
                    }
                    if (error?.retryable) {
                        logging.log(
                            `Q Developer Profile Discovery: This error is retryable - service may be temporarily unavailable`
                        )
                    }
                }
            })
        } catch (loggingError) {
            logging.error(`Q Developer Profile Discovery: Error during results logging: ${loggingError}`)
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

        try {
            logging.log(
                `Q Developer Profile Discovery: Final results - Found ${allProfiles.length} total profile(s) across all regions`
            )
            if (allProfiles.length > 0) {
                logging.log(`Q Developer Profile Discovery: Available profiles summary:`)
                allProfiles.forEach(profile => {
                    logging.log(
                        `Q Developer Profile Discovery: Profile - Name: ${profile.name}, Region: ${profile.identityDetails?.region}`
                    )
                    logging.log(`Q Developer Profile Discovery: Profile ARN: ${profile.arn}`)
                })
            } else {
                logging.log(
                    `Q Developer Profile Discovery: WARNING - No profiles found in any region. Possible causes:`
                )
                logging.log(
                    `Q Developer Profile Discovery: - No Q Developer profiles are configured in your AWS account`
                )
                logging.log(`Q Developer Profile Discovery: - Service connectivity issues (check error details above)`)
            }
        } catch (loggingError) {
            logging.error(`Q Developer Profile Discovery: Error during summary logging: ${loggingError}`)
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
    logging: Logging,
    token: CancellationToken
): Promise<AmazonQDeveloperProfile[]> {
    let allRegionalProfiles: AmazonQDeveloperProfile[] = []
    let nextToken: string | undefined = undefined
    let numberOfPages = 0

    try {
        logging.log(`Q Developer Profile Search: Starting profile search in region ${region}`)

        do {
            if (token.isCancellationRequested) {
                logging.log(
                    `Q Developer Profile Search: Search cancelled for region ${region} at page ${numberOfPages + 1}`
                )
                return allRegionalProfiles
            }

            const requestParams = {
                maxResults: MAX_Q_DEVELOPER_PROFILES_PER_PAGE,
                nextToken: nextToken,
            }
            logging.debug(
                `Q Developer Profile Search: Request parameters for region ${region}: ${JSON.stringify(requestParams)}`
            )

            const response = await service.listAvailableProfiles(requestParams)

            const profiles = response.profiles.map(profile => ({
                arn: profile.arn,
                name: profile.profileName,
                identityDetails: {
                    region,
                },
            }))

            if (profiles.length > 0) {
                profiles.forEach(profile => {
                    logging.log(`Q Developer Profile Search: Profile found - ${profile.name}`)
                })
            }

            allRegionalProfiles.push(...profiles)

            nextToken = response.nextToken
            numberOfPages++
        } while (nextToken !== undefined && numberOfPages < MAX_Q_DEVELOPER_PROFILE_PAGES)

        logging.log(
            `Q Developer Profile Search: Completed region ${region} - ${allRegionalProfiles.length} total profile(s) found`
        )
        return allRegionalProfiles
    } catch (error: any) {
        logging.log(`Q Developer Profile Search: Error occurred while searching region ${region}:`)
        logging.log(`Q Developer Profile Search: Error Type: ${error?.name || 'Unknown'}`)
        logging.log(`Q Developer Profile Search: Error Message: ${error?.message || 'No message available'}`)

        if (error?.statusCode) {
            logging.log(`Q Developer Profile Search: HTTP Status Code: ${error.statusCode}`)

            if (error.statusCode === 503) {
                logging.log(`Q Developer Profile Search: Service Unavailable Details for region ${region}:`)
                logging.log(
                    `Q Developer Profile Search: The Q Developer service in ${region} is temporarily unavailable`
                )

                if (error?.code) logging.log(`Q Developer Profile Search: AWS Error Code: ${error.code}`)
                if (error?.requestId) logging.log(`Q Developer Profile Search: Request ID: ${error.requestId}`)
                if (error?.extendedRequestId)
                    logging.log(`Q Developer Profile Search: Extended Request ID: ${error.extendedRequestId}`)
                if (error?.cfId) logging.log(`Q Developer Profile Search: CloudFront ID: ${error.cfId}`)
                if (error?.region) logging.log(`Q Developer Profile Search: Error Region: ${error.region}`)
                if (error?.hostname) logging.log(`Q Developer Profile Search: Service Hostname: ${error.hostname}`)
                if (error?.time) logging.log(`Q Developer Profile Search: Error Timestamp: ${error.time}`)

                if (error?.retryDelay)
                    logging.log(`Q Developer Profile Search: Suggested Retry Delay: ${error.retryDelay}ms`)
                if (error?.retryable !== undefined)
                    logging.log(`Q Developer Profile Search: Retryable: ${error.retryable}`)

                if (error?.$response?.httpResponse?.headers) {
                    const headers = error.$response.httpResponse.headers
                    if (headers['retry-after'])
                        logging.log(`Q Developer Profile Search: Retry After: ${headers['retry-after']} seconds`)
                    if (headers['x-amzn-errortype'])
                        logging.log(`Q Developer Profile Search: Amazon Error Type: ${headers['x-amzn-errortype']}`)
                    if (headers['x-amz-apigw-id'])
                        logging.log(`Q Developer Profile Search: API Gateway ID: ${headers['x-amz-apigw-id']}`)
                }
            } else if (error.statusCode === 403) {
                logging.log(
                    `Q Developer Profile Search: Access Denied - Check your permissions for Q Developer in region ${region}`
                )
            } else if (error.statusCode === 429) {
                logging.log(`Q Developer Profile Search: Rate Limited - Too many requests to region ${region}`)
            }
        }

        if (error?.retryable) {
            logging.log(`Q Developer Profile Search: This is a retryable error - you can try again later`)
        }

        logging.debug(
            `Q Developer Profile Search: Complete error object for region ${region}: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`
        )

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
