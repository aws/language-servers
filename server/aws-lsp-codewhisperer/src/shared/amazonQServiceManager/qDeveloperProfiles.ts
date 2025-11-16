import {
    AWSInitializationOptions,
    CancellationToken,
    Logging,
    LSPErrorCodes,
    ResponseError,
    SsoConnectionType,
} from '@aws/language-server-runtimes/server-interface'
import { isBool, isObject } from '../utils'
import { AWS_Q_ENDPOINTS, ATX_FES_ENDPOINTS } from '../../shared/constants'
import { CodeWhispererServiceToken } from '../codeWhispererService'
import { AmazonQServiceProfileThrottlingError } from './errors'
import * as https from 'https'
import { URL } from 'url'

export interface AmazonQDeveloperProfile {
    arn: string
    name: string
    identityDetails?: IdentityDetails
    applicationUrl?: string
}

interface IdentityDetails {
    region: string
}

export interface ListAllAvailableProfilesHandlerParams {
    connectionType: SsoConnectionType
    logging: Logging
    endpoints?: Map<string, string> // override option for flexibility, we default to all (AWS_Q_ENDPOINTS)
    atxFesEndpoints?: Map<string, string> // ATX FES endpoints for Transform profiles
    credentialsProvider?: any // Add credentials provider for ATX FES calls
    token: CancellationToken
}

export type ListAllAvailableProfilesHandler = (
    params: ListAllAvailableProfilesHandlerParams
) => Promise<AmazonQDeveloperProfile[]>

export const MAX_Q_DEVELOPER_PROFILE_PAGES = 10
const MAX_Q_DEVELOPER_PROFILES_PER_PAGE = 10

export const getListAllAvailableProfilesHandler =
    (service: (region: string, endpoint: string) => CodeWhispererServiceToken): ListAllAvailableProfilesHandler =>
    async ({
        connectionType,
        logging,
        endpoints,
        atxFesEndpoints,
        credentialsProvider,
        token,
    }): Promise<AmazonQDeveloperProfile[]> => {
        if (!connectionType || connectionType !== 'identityCenter') {
            logging.debug('Connection type is not set or not identityCenter - returning empty response.')
            return []
        }

        let allProfiles: AmazonQDeveloperProfile[] = []
        const qEndpoints = endpoints ?? AWS_Q_ENDPOINTS
        const atxEndpoints = atxFesEndpoints ?? ATX_FES_ENDPOINTS

        // Log dual authentication approach
        logging.log('=== Dual Authentication Profile Discovery ===')
        logging.log(`RTS endpoints (Q Developer): ${Array.from(qEndpoints.keys()).join(', ')}`)
        logging.log(`ATX FES endpoints (Transform): ${Array.from(atxEndpoints.keys()).join(', ')}`)

        if (token.isCancellationRequested) {
            return []
        }

        // Fetch from both RTS and ATX FES endpoints
        const rtsPromises = Array.from(qEndpoints.entries()).map(([region, endpoint]) => {
            logging.log(`Creating RTS service client for region: ${region}`)
            const codeWhispererService = service(region, endpoint)
            return fetchProfilesFromRTS(codeWhispererService, region, logging, token)
        })

        const atxPromises = Array.from(atxEndpoints.entries()).map(([region, endpoint]) => {
            logging.log(`Creating ATX FES client for region: ${region}`)
            return fetchProfilesFromATXFES(region, endpoint, logging, credentialsProvider || null, token)
        })

        const allPromises = [...rtsPromises, ...atxPromises]
        const result = await Promise.allSettled(allPromises)

        if (token.isCancellationRequested) {
            return []
        }

        // Log detailed results from each endpoint
        try {
            const rtsResults = result.slice(0, rtsPromises.length)
            const atxResults = result.slice(rtsPromises.length)

            rtsResults.forEach((settledResult, index) => {
                const [region] = Array.from(qEndpoints.entries())[index]
                if (settledResult.status === 'fulfilled') {
                    const profiles = settledResult.value
                    logging.log(`RTS ${region}: Successfully fetched ${profiles.length} profiles`)
                    profiles.forEach(profile => {
                        const profileType = isAWSTransformProfile(profile.arn || '') ? 'Transform' : 'Q Developer'
                        logging.log(`  RTS Profile: ${profile.name} (${profileType}) - ${profile.arn}`)
                    })
                } else {
                    logging.error(`RTS ${region}: Failed - ${settledResult.reason?.message || 'unknown error'}`)
                }
            })

            atxResults.forEach((settledResult, index) => {
                const [region] = Array.from(atxEndpoints.entries())[index]
                if (settledResult.status === 'fulfilled') {
                    const profiles = settledResult.value
                    logging.log(`ATX FES ${region}: Successfully fetched ${profiles.length} profiles`)
                    profiles.forEach(profile => {
                        logging.log(
                            `  ATX Profile: ${profile.name} (${profile.arn}) - applicationUrl: ${profile.applicationUrl || 'N/A'}`
                        )
                    })
                } else {
                    logging.error(`ATX FES ${region}: Failed - ${settledResult.reason?.message || 'unknown error'}`)
                }
            })
        } catch (loggingError) {
            logging.error(`Error in detailed logging: ${loggingError}`)
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
            throw new ResponseError(
                LSPErrorCodes.RequestFailed,
                `Failed to retrieve profiles from all queried endpoints (RTS and ATX FES)`
            )
        }

        fulfilledResults.forEach(fulfilledResult => allProfiles.push(...fulfilledResult.value))

        // Log summary of all profiles fetched with dual authentication
        try {
            logging.log(`=== Dual Authentication Summary ===`)
            logging.log(`Total profiles fetched: ${allProfiles.length}`)
            if (allProfiles.length > 0) {
                const qDeveloperProfiles = allProfiles.filter(p => !isAWSTransformProfile(p.arn || ''))
                const transformProfiles = allProfiles.filter(p => isAWSTransformProfile(p.arn || ''))

                logging.log(`Q Developer profiles: ${qDeveloperProfiles.length}`)
                logging.log(`Transform profiles: ${transformProfiles.length}`)

                if (qDeveloperProfiles.length > 0) {
                    logging.log(`Q Developer profile names: ${qDeveloperProfiles.map(p => p.name).join(', ')}`)
                }
                if (transformProfiles.length > 0) {
                    logging.log(`Transform profile names: ${transformProfiles.map(p => p.name).join(', ')}`)
                    transformProfiles.forEach(profile => {
                        logging.log(
                            `  Transform Profile: ${profile.name} - applicationUrl: ${profile.applicationUrl || 'N/A'}`
                        )
                    })

                    // Note: CreateJob will be called later when user clicks "Port Solution"
                    // Not during profile discovery
                }
            }
        } catch (loggingError) {
            logging.error(`Error in summary logging: ${loggingError}`)
        }

        // Check for partial throttling
        if (hasThrottlingError && allProfiles.length == 0) {
            logging.error(throttlingErrorMessage)
            throw new AmazonQServiceProfileThrottlingError(throttlingErrorMessage)
        }

        return allProfiles
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

/**
 * Determines if a profile ARN represents an AWS Transform profile
 */
function isAWSTransformProfile(profileArn: string): boolean {
    return profileArn.includes(':transform:')
}

/**
 * Generates a UUID for idempotency tokens
 */
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0
        const v = c == 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
    })
}

/**
 * Creates a new Transform job via ATX FES CreateJob API
 */
async function createATXFESJob(
    region: string,
    endpoint: string,
    logging: Logging,
    credentialsProvider: any | null,
    applicationUrl: string,
    workspaceId: string = 'test-workspace-001'
): Promise<{ jobId: string; status: string } | null> {
    try {
        logging.log(`=== ATX FES CreateJob Operation ===`)
        logging.log(`Starting CreateJob for workspace: ${workspaceId}`)

        if (!credentialsProvider || !credentialsProvider.hasCredentials('bearer')) {
            logging.log(`CreateJob ${region}: No bearer token credentials available, skipping`)
            return null
        }

        // Get bearer token from credentials provider
        const credentials = await credentialsProvider.getCredentials('bearer')
        if (!credentials || !credentials.token) {
            logging.log(`CreateJob ${region}: Failed to get bearer token, skipping`)
            return null
        }

        const bearerToken = credentials.token
        logging.log(`CreateJob ${region}: Got bearer token, making API call`)

        // Parse endpoint URL
        const url = new URL(endpoint)

        // Generate request body
        const requestBody = JSON.stringify({
            workspaceId: workspaceId, // Add workspaceId to request body
            objective: 'Transform .NET Framework project to .NET 8.0',
            jobType: 'DOT_NET',
            jobName: `transform-job-${Date.now()}`,
            intent: 'LANGUAGE_UPGRADE',
            idempotencyToken: generateUUID(),
        })

        // Prepare ATX FES headers for CreateJob
        const headers = {
            'Content-Type': 'application/json; charset=UTF-8',
            'Content-Encoding': 'amz-1.0',
            'X-Amz-Target': 'com.amazon.elasticgumbyfrontendservice.ElasticGumbyFrontEndService.CreateJob',
            Authorization: `Bearer ${bearerToken}`,
            Origin: applicationUrl,
            'Content-Length': Buffer.byteLength(requestBody).toString(),
        }

        const path = `/workspaces/${workspaceId}/jobs`
        logging.log(`CreateJob ${region}: Making request to ${endpoint}${path}`)
        logging.log(`CreateJob ${region}: Request body: ${requestBody}`)
        logging.debug(`CreateJob ${region}: Headers: ${JSON.stringify(Object.keys(headers))}`)

        // Make the ATX FES CreateJob API call using Node.js https
        const response = await new Promise<{ statusCode: number; statusMessage: string; data: string }>(
            (resolve, reject) => {
                const req = https.request(
                    {
                        hostname: url.hostname,
                        port: url.port || 443,
                        path: path,
                        method: 'POST',
                        headers: headers,
                    },
                    res => {
                        let data = ''
                        res.on('data', chunk => {
                            data += chunk
                        })
                        res.on('end', () => {
                            resolve({
                                statusCode: res.statusCode || 0,
                                statusMessage: res.statusMessage || '',
                                data: data,
                            })
                        })
                    }
                )

                req.on('error', error => {
                    reject(error)
                })

                req.write(requestBody)
                req.end()
            }
        )

        logging.log(`CreateJob ${region}: Response status: ${response.statusCode} ${response.statusMessage}`)
        logging.log(`CreateJob ${region}: Raw response: ${response.data}`)

        if (response.statusCode < 200 || response.statusCode >= 300) {
            logging.error(`CreateJob ${region}: API call failed: ${response.statusCode} ${response.statusMessage}`)
            logging.error(`CreateJob ${region}: Error response: ${response.data}`)
            return null
        }

        const data = JSON.parse(response.data)
        logging.log(`CreateJob ${region}: Parsed response: ${JSON.stringify(data)}`)

        // Extract job information
        const jobId = data.jobId
        const status = data.status

        if (jobId) {
            logging.log(`CreateJob ${region}: SUCCESS - Job created with ID: ${jobId}, Status: ${status}`)
            return { jobId, status }
        } else {
            logging.error(`CreateJob ${region}: No jobId in response`)
            return null
        }
    } catch (error) {
        logging.error(`Error in CreateJob for region: ${region}`)
        logging.error(`CreateJob error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        logging.log(`CreateJob error details: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`)
        return null
    }
}

/**
 * Fetches profiles from ATX FES endpoints for Transform profiles
 */
async function fetchProfilesFromATXFES(
    region: string,
    endpoint: string,
    logging: Logging,
    credentialsProvider: any | null,
    token: CancellationToken
): Promise<AmazonQDeveloperProfile[]> {
    try {
        logging.log(`Starting ATX FES profile fetch from region: ${region}`)

        if (token.isCancellationRequested) {
            logging.debug(`Cancellation requested during ATX FES profile fetch from region: ${region}`)
            return []
        }

        // Check if we have bearer token credentials
        if (!credentialsProvider || !credentialsProvider.hasCredentials('bearer')) {
            logging.log(`ATX FES ${region}: No bearer token credentials available, skipping`)
            return []
        }

        // Get bearer token from credentials provider
        const credentials = await credentialsProvider.getCredentials('bearer')
        if (!credentials || !credentials.token) {
            logging.log(`ATX FES ${region}: Failed to get bearer token, skipping`)
            return []
        }

        const bearerToken = credentials.token
        logging.log(`ATX FES ${region}: Got bearer token, making API call`)

        // Parse endpoint URL
        const url = new URL(endpoint)

        // Prepare request body
        const requestBody = JSON.stringify({})

        // Prepare ATX FES headers
        const headers = {
            'Content-Type': 'application/json; charset=UTF-8',
            'Content-Encoding': 'amz-1.0',
            'X-Amz-Target': 'com.amazon.elasticgumbyfrontendservice.ElasticGumbyFrontEndService.ListAvailableProfiles',
            Authorization: `Bearer ${bearerToken}`,
            'Content-Length': Buffer.byteLength(requestBody).toString(),
        }

        logging.log(`ATX FES ${region}: Making request to ${endpoint}`)
        logging.log(`ATX FES ${region}: Request body: ${requestBody}`)
        logging.log(`ATX FES ${region}: Full headers: ${JSON.stringify(headers, null, 2)}`)
        logging.log(`ATX FES ${region}: Bearer token length: ${bearerToken.length}`)
        logging.log(`ATX FES ${region}: Bearer token prefix: ${bearerToken.substring(0, 20)}...`)

        // Make the ATX FES API call using Node.js https
        const response = await new Promise<{ statusCode: number; statusMessage: string; data: string; headers: any }>(
            (resolve, reject) => {
                const req = https.request(
                    {
                        hostname: url.hostname,
                        port: url.port || 443,
                        path: url.pathname + url.search,
                        method: 'POST',
                        headers: headers,
                    },
                    res => {
                        let data = ''
                        res.on('data', chunk => {
                            data += chunk
                        })
                        res.on('end', () => {
                            resolve({
                                statusCode: res.statusCode || 0,
                                statusMessage: res.statusMessage || '',
                                data: data,
                                headers: res.headers,
                            })
                        })
                    }
                )

                req.on('error', error => {
                    reject(error)
                })

                req.write(requestBody)
                req.end()
            }
        )

        logging.log(`ATX FES ${region}: Response status: ${response.statusCode} ${response.statusMessage}`)
        logging.log(`ATX FES ${region}: Response headers: ${JSON.stringify(response.headers)}`)
        logging.log(`ATX FES ${region}: Raw response body: ${response.data}`)

        if (response.statusCode < 200 || response.statusCode >= 300) {
            logging.error(`ATX FES ${region}: API call failed: ${response.statusCode} ${response.statusMessage}`)
            logging.error(`ATX FES ${region}: Error response: ${response.data}`)
            logging.error(
                `ATX FES ${region}: Full error context - endpoint: ${endpoint}, bearerToken length: ${bearerToken.length}`
            )
            throw new Error(`ATX FES API call failed: ${response.statusCode} ${response.statusMessage}`)
        }

        const data = JSON.parse(response.data)
        logging.log(`ATX FES ${region}: Raw response: ${JSON.stringify(data)}`)

        // Parse ATX FES response
        const profiles =
            data.profiles?.map((profile: any) => ({
                arn: profile.arn,
                name: profile.profileName,
                identityDetails: { region },
                applicationUrl: profile.applicationUrl,
            })) || []

        logging.log(`ATX FES ${region}: Parsed ${profiles.length} Transform profiles`)
        profiles.forEach((profile: AmazonQDeveloperProfile) => {
            logging.log(
                `  ATX FES Profile: ${profile.name} (${profile.arn}) - applicationUrl: ${profile.applicationUrl || 'N/A'}`
            )
        })

        return profiles
    } catch (error) {
        logging.error(`Error fetching profiles from ATX FES region: ${region}`)
        logging.error(`ATX FES error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        logging.log(`ATX FES error details: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`)

        // Don't throw - return empty array to allow other endpoints to succeed
        return []
    }
}

/**
 * Renamed the original function to be more specific
 */
async function fetchProfilesFromRTS(
    service: CodeWhispererServiceToken,
    region: string,
    logging: Logging,
    token: CancellationToken
): Promise<AmazonQDeveloperProfile[]> {
    let allRegionalProfiles: AmazonQDeveloperProfile[] = []
    let nextToken: string | undefined = undefined
    let numberOfPages = 0

    try {
        logging.log(`Starting RTS profile fetch from region: ${region}`)

        do {
            logging.debug(`Fetching RTS profiles from region: ${region} (page: ${numberOfPages + 1})`)

            if (token.isCancellationRequested) {
                logging.debug(`Cancellation requested during RTS profile fetch from region: ${region}`)
                return allRegionalProfiles
            }

            const requestParams = {
                maxResults: MAX_Q_DEVELOPER_PROFILES_PER_PAGE,
                nextToken: nextToken,
            }
            logging.debug(`RTS request params for region ${region}: ${JSON.stringify(requestParams)}`)

            const response = await service.listAvailableProfiles(requestParams)

            logging.debug(`RTS raw response from ${region}: ${JSON.stringify(response)}`)

            const profiles =
                response.profiles?.map(profile => ({
                    arn: profile.arn || '',
                    name: profile.profileName || '',
                    identityDetails: {
                        region,
                    },
                    applicationUrl: (profile as any).applicationUrl,
                })) || []

            logging.log(`RTS ${region}: Fetched ${profiles.length} profiles (page: ${numberOfPages + 1})`)
            if (profiles.length > 0) {
                logging.log(`RTS profile names from ${region}: ${profiles.map(p => p.name).join(', ')}`)
                profiles.forEach(profile => {
                    const profileType = isAWSTransformProfile(profile.arn || '') ? 'Transform' : 'Q Developer'
                    logging.log(
                        `  RTS Profile: ${profile.name} (${profileType}), applicationUrl: ${profile.applicationUrl || 'N/A'}`
                    )
                })
            }

            allRegionalProfiles.push(...profiles)

            nextToken = response.nextToken
            if (nextToken) {
                logging.debug(`Next token received from RTS ${region}: ${nextToken.substring(0, 10)}...`)
            } else {
                logging.debug(`No next token received from RTS ${region}, pagination complete`)
            }

            numberOfPages++
        } while (nextToken !== undefined && numberOfPages < MAX_Q_DEVELOPER_PROFILE_PAGES)

        logging.log(`Completed RTS profile fetch from ${region}, total profiles: ${allRegionalProfiles.length}`)
        return allRegionalProfiles
    } catch (error) {
        logging.error(`Error fetching RTS profiles from region: ${region}`)
        logging.log(`RTS error object: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`)
        throw error
    }
}
