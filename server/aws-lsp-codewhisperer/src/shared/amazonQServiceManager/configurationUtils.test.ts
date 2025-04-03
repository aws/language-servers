import { TestFeatures } from '@aws/language-server-runtimes/testing'
import {
    AmazonQConfigurationCache,
    AmazonQWorkspaceConfig,
    CODE_WHISPERER_CONFIGURATION_SECTION,
    defaultAmazonQWorkspaceConfigFactory,
    getAmazonQRelatedWorkspaceConfigs,
} from './configurationUtils'
import { Q_CONFIGURATION_SECTION } from '../../language-server/configuration/qConfigurationServer'
import { deepStrictEqual, notDeepStrictEqual } from 'assert'

describe('getAmazonQRelatedWorkspaceConfigs', () => {
    let features: TestFeatures
    let cache: AmazonQConfigurationCache

    const MOCKED_AWS_Q_SECTION = {
        customization: 'some-customization-arn',
        optOutTelemetry: true,
        inlineSuggestions: {
            extraContext: 'some-extra-context',
        },
    }

    const MOCKED_AWS_CODEWHISPERER_SECTION = {
        includeSuggestionsWithCodeReferences: true,
        shareCodeWhispererContentWithAWS: true,
    }

    beforeEach(() => {
        cache = new AmazonQConfigurationCache()
        features = new TestFeatures()

        features.lsp.workspace.getConfiguration.withArgs(Q_CONFIGURATION_SECTION).resolves(MOCKED_AWS_Q_SECTION)
        features.lsp.workspace.getConfiguration
            .withArgs(CODE_WHISPERER_CONFIGURATION_SECTION)
            .resolves(MOCKED_AWS_CODEWHISPERER_SECTION)
    })

    it('fetches the configurations and returns them', async () => {
        const EXPECTED_CONFIG: AmazonQWorkspaceConfig = {
            customizationArn: MOCKED_AWS_Q_SECTION.customization,
            optOutTelemetryPreference: 'OPTOUT',
            inlineSuggestions: { extraContext: MOCKED_AWS_Q_SECTION.inlineSuggestions.extraContext },
            includeSuggestionsWithCodeReferences: MOCKED_AWS_CODEWHISPERER_SECTION.includeSuggestionsWithCodeReferences,
            shareCodeWhispererContentWithAWS: MOCKED_AWS_CODEWHISPERER_SECTION.shareCodeWhispererContentWithAWS,
        }

        const amazonQConfig = await getAmazonQRelatedWorkspaceConfigs(features.lsp, features.logging)

        deepStrictEqual(amazonQConfig, EXPECTED_CONFIG)
    })

    it('empty strings returned by q section are set to undefined', async () => {
        const firstResult = await getAmazonQRelatedWorkspaceConfigs(features.lsp, features.logging)
        deepStrictEqual(firstResult.customizationArn, MOCKED_AWS_Q_SECTION.customization)
        deepStrictEqual(
            firstResult.inlineSuggestions?.extraContext,
            MOCKED_AWS_Q_SECTION.inlineSuggestions.extraContext
        )

        features.lsp.workspace.getConfiguration
            .withArgs(Q_CONFIGURATION_SECTION)
            .resolves({ customization: '', inlineSuggestions: { extraContext: '' } })
        const secondResult = await getAmazonQRelatedWorkspaceConfigs(features.lsp, features.logging)

        deepStrictEqual(secondResult.customizationArn, undefined)
        deepStrictEqual(secondResult.inlineSuggestions?.extraContext, undefined)
    })
})

describe('AmazonQConfigurationCache', () => {
    let cache: AmazonQConfigurationCache

    let mockedQConfig: AmazonQWorkspaceConfig

    beforeEach(() => {
        cache = new AmazonQConfigurationCache()

        mockedQConfig = {
            customizationArn: 'some-arn',
            optOutTelemetryPreference: 'OPTIN',
            inlineSuggestions: {
                extraContext: 'some-extra-context',
            },
            includeSuggestionsWithCodeReferences: false,
            shareCodeWhispererContentWithAWS: true,
        }
    })

    it('initializes with the default configuration', () => {
        deepStrictEqual(cache.getConfig(), defaultAmazonQWorkspaceConfigFactory())
    })

    it('mutating the object used by setConfig does not alter the cached config ', () => {
        cache.updateConfig(mockedQConfig)
        deepStrictEqual(cache.getConfig(), mockedQConfig)

        mockedQConfig.customizationArn = undefined
        mockedQConfig.inlineSuggestions = { extraContext: undefined }
        notDeepStrictEqual(cache.getProperty('customizationArn'), mockedQConfig.customizationArn)
        notDeepStrictEqual(cache.getProperty('inlineSuggestions'), mockedQConfig.inlineSuggestions)
    })
})
