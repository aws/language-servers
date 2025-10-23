import { CancellationToken, Logging, SsoConnectionType } from '@aws/language-server-runtimes/server-interface'
import { AtxTokenServiceManager } from './AtxTokenServiceManager'
import { ATX_FES_ENDPOINTS } from '../constants'

export interface AtxTransformProfile {
    arn: string | undefined
    name: string | undefined
    applicationUrl: string | undefined
    identityDetails?: AtxIdentityDetails
}

interface AtxIdentityDetails {
    region: string
}

export interface ListAllAvailableAtxProfilesHandlerParams {
    connectionType: SsoConnectionType
    logging: Logging
    atxEndpoints?: Map<string, string>
    token: CancellationToken
}

export type ListAllAvailableAtxProfilesHandler = (
    params: ListAllAvailableAtxProfilesHandlerParams
) => Promise<AtxTransformProfile[]>

export const MAX_ATX_PROFILE_PAGES = 10
const MAX_ATX_PROFILES_PER_PAGE = 10

export const getListAllAvailableAtxProfilesHandler =
    (atxTokenServiceManager: AtxTokenServiceManager): ListAllAvailableAtxProfilesHandler =>
    async ({ connectionType, logging, atxEndpoints, token }): Promise<AtxTransformProfile[]> => {
        if (!connectionType || connectionType !== 'identityCenter') {
            logging.debug('ATX Profiles: Connection type is not identityCenter - returning empty response.')
            return []
        }

        let allAtxProfiles: AtxTransformProfile[] = []
        const endpoints = atxEndpoints ?? ATX_FES_ENDPOINTS

        logging.log(`ATX Profiles: Fetching from ${endpoints.size} regions`)

        if (token.isCancellationRequested) {
            return []
        }

        const result = await Promise.allSettled(
            Array.from(endpoints.entries(), ([region, endpoint]) => {
                return fetchAtxProfilesFromRegion(atxTokenServiceManager, region, endpoint, logging, token)
            })
        )

        if (token.isCancellationRequested) {
            return []
        }

        result.forEach((settledResult, index) => {
            const [region, endpoint] = Array.from(endpoints.entries())[index]
            if (settledResult.status === 'fulfilled') {
                const profiles = settledResult.value
            } else {
                logging.error(
                    `ATX Profiles: Failed to fetch from region: ${region}, error: ${settledResult.reason?.name || 'unknown'}`
                )
            }
        })

        const fulfilledResults = result.filter(settledResult => settledResult.status === 'fulfilled')

        if (fulfilledResults.length === 0) {
            throw new Error('Failed to retrieve ATX profiles from all queried regions')
        }

        fulfilledResults.forEach(fulfilledResult => allAtxProfiles.push(...fulfilledResult.value))

        logging.log(`ATX Profiles: Total profiles fetched: ${allAtxProfiles.length}`)

        return allAtxProfiles
    }

async function fetchAtxProfilesFromRegion(
    atxTokenServiceManager: AtxTokenServiceManager,
    region: string,
    endpoint: string,
    logging: Logging,
    token: CancellationToken
): Promise<AtxTransformProfile[]> {
    let allRegionalProfiles: AtxTransformProfile[] = []
    let nextToken: string | undefined = undefined
    let numberOfPages = 0

    try {
        const { ElasticGumbyFrontendClient, ListAvailableProfilesCommand } = await import(
            '@amazon/elastic-gumby-frontend-client'
        )

        const atxClient = new ElasticGumbyFrontendClient({
            region: region,
            endpoint: endpoint,
        })

        do {
            if (token.isCancellationRequested) {
                return allRegionalProfiles
            }

            const command: any = new ListAvailableProfilesCommand({
                maxResults: MAX_ATX_PROFILES_PER_PAGE,
                nextToken: nextToken,
            })

            // Add bearer token authentication
            const bearerToken = await atxTokenServiceManager.getBearerToken()
            command.middlewareStack?.add(
                (next: any) => async (args: any) => {
                    if (!args.request.headers) {
                        args.request.headers = {}
                    }
                    args.request.headers['Authorization'] = `Bearer ${bearerToken}`
                    return next(args)
                },
                {
                    step: 'build',
                    name: 'addAtxBearerToken',
                    priority: 'high',
                }
            )

            const response: any = await atxClient.send(command)

            const profiles =
                response.profiles?.map((profile: any) => {
                    // Strip trailing slash from applicationUrl
                    const applicationUrl = profile.applicationUrl?.replace(/\/$/, '') || profile.applicationUrl

                    return {
                        arn: profile.arn,
                        name: profile.profileName || profile.name,
                        applicationUrl: applicationUrl,
                        identityDetails: {
                            region,
                        },
                    }
                }) ?? []

            allRegionalProfiles.push(...profiles)

            nextToken = response.nextToken
            numberOfPages++
        } while (nextToken !== undefined && numberOfPages < MAX_ATX_PROFILE_PAGES)

        return allRegionalProfiles
    } catch (error) {
        logging.error(`ATX Profiles: Error fetching from region: ${region}`)
        logging.error(`ATX Profiles: Error details: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`)
        throw error
    }
}
