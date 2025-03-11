import { AWS_Q_ENDPOINTS } from '../../constants'
import { CodeWhispererServiceToken } from '../codeWhispererService'
import { AmazonQDeveloperProfile, Features } from './AmazonQTokenServiceManager'

const dummyProfiles: AmazonQDeveloperProfile[] = [
    {
        arn: 'profile-iad',
        profileName: 'profile-iad',
        region: 'us-east-1',
    },
    {
        arn: 'profile-fra',
        profileName: 'profile-fra',
        region: 'eu-central-1',
    },
]

export async function listAvailableProfiles(features: Features) {
    const allProfiles: AmazonQDeveloperProfile[] = []

    // Loop through AWS_Q_ENDPOINTS and list available profiles
    for (const [region, endpoint] of Object.entries(AWS_Q_ENDPOINTS)) {
        try {
            const codewhispererService = new CodeWhispererServiceToken(
                features!.credentialsProvider,
                features!.workspace,
                region,
                endpoint,
                features!.sdkInitializator
            )

            const resp = await codewhispererService.listAvailableProfiles()

            if (resp) {
                // Add region information to each profile
                const profilesWithRegion = resp.profiles.map(profile => ({
                    ...profile,
                    region,
                }))

                allProfiles.push(...profilesWithRegion)
            }

            features!.logging.log(`Got profiles from ${region}: ${JSON.stringify(resp)}`)
        } catch (error) {
            // Log error but continue with other regions
            features!.logging.error(`Error fetching profiles from ${region}: ${error}`)
        }
    }

    // TODO: remove, only for testings
    allProfiles.push(...dummyProfiles)

    return allProfiles
}
