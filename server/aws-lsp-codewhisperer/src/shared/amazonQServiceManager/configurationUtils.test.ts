import { TestFeatures } from '@aws/language-server-runtimes/testing'
import {
    AmazonQConfigurationCache,
    AmazonQWorkspaceConfig,
    defaultAmazonQWorkspaceConfigFactory,
    getAmazonQRelatedWorkspaceConfigs,
} from './configurationUtils'
import { deepStrictEqual, notDeepStrictEqual } from 'assert'
import { Q_CONFIGURATION_SECTION, CODE_WHISPERER_CONFIGURATION_SECTION } from '../constants'

describe('getAmazonQRelatedWorkspaceConfigs', () => {
    let features: TestFeatures

    const MOCKED_AWS_Q_SECTION = {
        customization: 'some-customization-arn',
        optOutTelemetry: true,
        inlineSuggestions: {
            extraContext: 'some-extra-context',
        },
        projectContext: {
            enableLocalIndexing: true,
            enableGpuAcceleration: true,
            indexWorkerThreads: 1,
            localIndexing: {
                ignoreFilePatterns: [],
                maxFileSizeMB: 10,
                maxIndexSizeMB: 2048,
                indexCacheDirPath: undefined,
            },
        },
    }

    const MOCKED_AWS_CODEWHISPERER_SECTION = {
        includeSuggestionsWithCodeReferences: true,
        includeImportsWithSuggestions: true,
        shareCodeWhispererContentWithAWS: true,
        sendUserWrittenCodeMetrics: false,
    }

    beforeEach(() => {
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
            includeImportsWithSuggestions: MOCKED_AWS_CODEWHISPERER_SECTION.includeImportsWithSuggestions,
            shareCodeWhispererContentWithAWS: MOCKED_AWS_CODEWHISPERER_SECTION.shareCodeWhispererContentWithAWS,
            sendUserWrittenCodeMetrics: MOCKED_AWS_CODEWHISPERER_SECTION.sendUserWrittenCodeMetrics,
            projectContext: {
                enableLocalIndexing: MOCKED_AWS_Q_SECTION.projectContext.enableLocalIndexing,
                enableGpuAcceleration: MOCKED_AWS_Q_SECTION.projectContext?.enableGpuAcceleration,
                indexWorkerThreads: MOCKED_AWS_Q_SECTION.projectContext?.indexWorkerThreads,
                localIndexing: MOCKED_AWS_Q_SECTION.projectContext.localIndexing,
            },
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
            includeImportsWithSuggestions: false,
            shareCodeWhispererContentWithAWS: true,
            sendUserWrittenCodeMetrics: false,
            projectContext: {
                enableLocalIndexing: true,
                enableGpuAcceleration: true,
                indexWorkerThreads: 1,
                localIndexing: {
                    ignoreFilePatterns: [],
                    maxFileSizeMB: 10,
                    maxIndexSizeMB: 2048,
                    indexCacheDirPath: undefined,
                },
            },
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
        mockedQConfig.projectContext = {
            enableLocalIndexing: false,
            enableGpuAcceleration: false,
            indexWorkerThreads: 0,
        }
        notDeepStrictEqual(cache.getProperty('customizationArn'), mockedQConfig.customizationArn)
        notDeepStrictEqual(cache.getProperty('inlineSuggestions'), mockedQConfig.inlineSuggestions)
        notDeepStrictEqual(cache.getProperty('projectContext'), mockedQConfig.projectContext)
    })
})
