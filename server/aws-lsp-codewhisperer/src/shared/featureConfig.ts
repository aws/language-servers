import {
    FeatureValue,
    ListFeatureEvaluationsCommandOutput,
    ListFeatureEvaluationsRequest,
    ListFeatureEvaluationsResponse,
    UserContext,
} from '@amzn/codewhisperer-runtime'
import { Logging } from '@aws/language-server-runtimes/server-interface'
import { CodeWhispererServiceToken } from './codeWhispererService'

export class FeatureContext {
    constructor(
        public name: string,
        public variation: string,
        public value: FeatureValue
    ) {}
}

const featureConfigPollIntervalInMs = 180 * 60 * 1000 // 180 mins

export const Features = {
    customizationArnOverride: 'customizationArnOverride',
    dataCollectionFeature: 'IDEProjectContextDataCollection',
    projectContextFeature: 'ProjectContextV2',
    workspaceContextFeature: 'WorkspaceContext',
    preFlareRollbackBIDFeature: 'PreflareRollbackExperiment_BID',
    preFlareRollbackIDCFeature: 'PreflareRollbackExperiment_IDC',
    test: 'testFeature',
    highlightCommand: 'highlightCommand',
} as const

export type FeatureName = (typeof Features)[keyof typeof Features]

export const featureDefinitions = new Map<FeatureName, FeatureContext>([
    [Features.test, new FeatureContext(Features.test, 'CONTROL', { stringValue: 'testValue' })],
    [
        Features.customizationArnOverride,
        new FeatureContext(Features.customizationArnOverride, 'customizationARN', { stringValue: '' }),
    ],
])

export class FeatureConfigProvider {
    private featureConfigs = new Map<string, FeatureContext>()
    private fetchPromise: Promise<void> | undefined = undefined
    private lastFetchTime = 0
    private readonly minFetchInterval = 5000 // 5 seconds minimum between fetches

    static #instance: FeatureConfigProvider

    constructor(
        private userContext: UserContext | undefined,
        private logging: Logging | undefined,
        readonly service: CodeWhispererServiceToken
    ) {
        this.fetchFeatureConfigs().catch(e => {
            this.logging?.error(`fetchFeatureConfigs failed: ${(e as Error).message}`)
        })

        setInterval(this.fetchFeatureConfigs.bind(this), featureConfigPollIntervalInMs)
    }

    public static get instance() {
        return this.#instance
    }

    public async listFeatureEvaluations(): Promise<ListFeatureEvaluationsCommandOutput> {
        const request: ListFeatureEvaluationsRequest = { userContext: this.userContext }
        return this.service.listFeatureEvaluations(request)
    }

    async fetchFeatureConfigs(): Promise<void> {
        // Debounce multiple concurrent calls
        const now = performance.now()
        if (this.fetchPromise && now - this.lastFetchTime < this.minFetchInterval) {
            // getLogger().debug('amazonq: Debouncing feature config fetch')
            return this.fetchPromise
        }

        if (this.fetchPromise) {
            return this.fetchPromise
        }

        this.lastFetchTime = now
        this.fetchPromise = this._fetchFeatureConfigsInternal()

        try {
            await this.fetchPromise
        } finally {
            this.fetchPromise = undefined
        }
    }

    private async _fetchFeatureConfigsInternal(): Promise<void> {
        this.logging?.debug('amazonq: Fetching feature configs')
        try {
            const response = await this.listFeatureEvaluations()
            if (!response.featureEvaluations) {
                return
            }

            // Overwrite feature configs from server response
            for (const evaluation of response.featureEvaluations) {
                if (!evaluation.feature || !evaluation.variation || !evaluation.value) {
                    return
                }
                this.featureConfigs.set(
                    evaluation.feature,
                    new FeatureContext(evaluation.feature, evaluation.variation, evaluation.value)
                )

                // TODO: telemetry
                // telemetry.aws_featureConfig.run(span => {
                //     span.record({
                //         id: evaluation.feature,
                //         featureVariation: evaluation.variation,
                //         featureValue: JSON.stringify(evaluation.value),
                //     })
                // })
            }
            this.logging?.info(`AB Testing Cohort Assignments ${response.featureEvaluations}`)
        } catch (e) {
            this.logging?.error(`CodeWhisperer: Error when fetching feature configs ${e}`)
        }
        this.logging?.debug(`CodeWhisperer: Current feature configs: ${this.getFeatureConfigsTelemetry()}`)
    }

    // Sample format: "{testFeature: CONTROL}""
    getFeatureConfigsTelemetry(): string {
        return `{${Array.from(this.featureConfigs.entries())
            .map(([name, context]) => `${name}: ${context.variation}`)
            .join(', ')}}`
    }

    // TODO: for all feature variations, define a contract that can be enforced upon the implementation of
    // the business logic.
    // When we align on a new feature config, client-side will implement specific business logic to utilize
    // these values by:
    // 1) Add an entry in featureDefinitions, which is <feature_name> to <feature_context>.
    // 2) Add a function with name `getXXX`, where XXX refers to the feature name.
    // 3) Specify the return type: One of the return type string/boolean/Long/Double should be used here.
    // 4) Specify the key for the `getFeatureValueForKey` helper function which is the feature name.
    // 5) Specify the corresponding type value getter for the `FeatureValue` class. For example,
    // if the return type is Long, then the corresponding type value getter is `longValue()`.
    // 6) Add a test case for this feature.
    // 7) In case `getXXX()` returns undefined, it should be treated as a default/control group.
    getTestFeature(): string | undefined {
        return this.getFeatureValueForKey(Features.test).stringValue
    }

    getCustomizationArnOverride(): string | undefined {
        return this.getFeatureValueForKey(Features.customizationArnOverride).stringValue
    }

    // Get the feature value for the given key.
    // In case of a misconfiguration, it will return a default feature value of Boolean true.
    private getFeatureValueForKey(name: FeatureName): FeatureValue {
        return this.featureConfigs.get(name)?.value ?? featureDefinitions.get(name)?.value ?? { boolValue: true }
    }

    /**
     * Map of feature configurations.
     *
     * @returns {Map<string, FeatureContext>} A Map containing the feature configurations, where the keys are strings representing the feature names, and the values are FeatureContext objects.
     */
    public static getFeatureConfigs(): Map<string, FeatureContext> {
        return FeatureConfigProvider.instance.featureConfigs
    }

    /**
     * Retrieves the FeatureContext object for a given feature name.
     *
     * @param {string} featureName - The name of the feature.
     * @returns {FeatureContext | undefined} The FeatureContext object for the specified feature, or undefined if the feature doesn't exist.
     */
    public static getFeature(featureName: FeatureName): FeatureContext | undefined {
        return FeatureConfigProvider.instance.featureConfigs.get(featureName)
    }

    /**
     * Checks if a feature is active or not.
     *
     * @param {string} featureName - The name of the feature to check.
     * @returns {boolean} False if the variation is not CONTROL, otherwise True
     */
    public static isEnabled(featureName: FeatureName): boolean {
        const featureContext = FeatureConfigProvider.getFeature(featureName)
        if (featureContext && featureContext.variation.toLocaleLowerCase() !== 'control') {
            return true
        }
        return false
    }
}
