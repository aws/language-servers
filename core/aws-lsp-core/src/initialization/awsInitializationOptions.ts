/**
 * The (optional) initialization options shape expected by
 * clients supporting AWS LSPs.
 *
 * This structure is exploration/conceptual/speculative at this time.
 */
export interface AwsInitializationOptions {
    credentials?: {
        providesIam?: boolean
        providesBearerToken?: boolean
    }
}
