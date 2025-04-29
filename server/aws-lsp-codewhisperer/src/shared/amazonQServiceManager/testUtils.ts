import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { CodeWhispererServiceBase } from '../codeWhispererService'
import { BaseAmazonQServiceManager, QServiceManagerFeatures } from './BaseAmazonQServiceManager'
import { StreamingClientServiceBase } from '../streamingClientService'
import {
    AmazonQServiceAlreadyInitializedError,
    AmazonQServiceInitializationError,
    AmazonQServiceNotInitializedError,
} from './errors'
import { throws, deepStrictEqual } from 'assert'
import {
    CancellationToken,
    CredentialsType,
    InitializeParams,
    UpdateConfigurationParams,
} from '@aws/language-server-runtimes/server-interface'

/**
 * A reusable test class that extends the abstract base class and allows for injecting features and service mocks.
 *
 * Note: it is the responsibility of the test suite to correctly reset/restore the injected mocks.
 */
export class TestAmazonQServiceManager extends BaseAmazonQServiceManager<
    CodeWhispererServiceBase,
    StreamingClientServiceBase
> {
    private static instance: TestAmazonQServiceManager | null = null

    private constructor(features: TestFeatures) {
        super(features)
    }

    public static initInstance(features: TestFeatures): TestAmazonQServiceManager {
        if (!TestAmazonQServiceManager.instance) {
            TestAmazonQServiceManager.instance = new TestAmazonQServiceManager(features)

            return TestAmazonQServiceManager.instance
        }

        throw new AmazonQServiceInitializationError('Test service is already initialized.')
    }

    public static getInstance(): TestAmazonQServiceManager {
        if (!TestAmazonQServiceManager.instance) {
            throw new AmazonQServiceNotInitializedError('Test service is not yet initialized')
        }

        return TestAmazonQServiceManager.instance
    }

    public getCodewhispererService(): CodeWhispererServiceBase {
        if (!this.cachedCodewhispererService) {
            throw new Error(
                'Found undefined cached service, make sure to setup TestAmazonQServiceManager class correctly'
            )
        }

        return this.cachedCodewhispererService
    }

    public getStreamingClient(): StreamingClientServiceBase {
        if (!this.cachedStreamingClient) {
            throw new Error(
                'Found undefined cached streaming client, make sure to setup TestAmazonQServiceManager class correctly'
            )
        }

        return this.cachedStreamingClient
    }

    public override handleOnCredentialsDeleted(_type: CredentialsType): void {
        return
    }

    public override handleOnUpdateConfiguration(
        _params: UpdateConfigurationParams,
        _token: CancellationToken
    ): Promise<void> {
        return Promise.resolve()
    }

    public withCodeWhispererService<C extends CodeWhispererServiceBase>(service: C) {
        this.cachedCodewhispererService = service
    }

    public withStreamingClientService<S extends StreamingClientServiceBase>(streamingClient: S) {
        this.cachedStreamingClient = streamingClient
    }

    public static resetInstance(): void {
        TestAmazonQServiceManager.instance = null
    }
}

/**
 *
 * @param features - TestFeatures
 * @param serviceMock - Mocked service, e.g. with sinon's stubInterface method.
 * @returns A mocked AmazonQServiceManager for testing
 */
export const initBaseTestServiceManager = <C extends CodeWhispererServiceBase, S extends StreamingClientServiceBase>(
    features: TestFeatures,
    serviceMock?: C,
    streamingClientMock?: S
): TestAmazonQServiceManager => {
    const testServiceManager = TestAmazonQServiceManager.initInstance(features)

    if (serviceMock) {
        testServiceManager.withCodeWhispererService(serviceMock)
    }

    if (streamingClientMock) {
        testServiceManager.withStreamingClientService(streamingClientMock)
    }

    return testServiceManager
}

/**
 * Helper function to test the initialization process of the service managers
 *
 * @param SingletonServiceManager - Token or IAM Service manager class
 *
 * @example
 *
 * ```ts
 * describe('some test name', () => {
 *     generateSingletonInitializationTests(AmazonQTokenServiceManager)
 * })
 * ```
 */
export const generateSingletonInitializationTests = <
    C extends CodeWhispererServiceBase,
    S extends StreamingClientServiceBase,
    T extends BaseAmazonQServiceManager<C, S>,
    U extends {
        getInstance(): T
        initInstance(features: QServiceManagerFeatures): T
        resetInstance(): void
    },
>(
    SingletonServiceManager: U
) => {
    let testFeatures: TestFeatures

    beforeEach(() => {
        testFeatures = new TestFeatures()
        testFeatures.setClientParams({} as InitializeParams)
    })

    afterEach(() => {
        SingletonServiceManager.resetInstance()
    })

    it('should throw when initInstance is called more than once', () => {
        SingletonServiceManager.initInstance(testFeatures)

        throws(() => SingletonServiceManager.initInstance(testFeatures), AmazonQServiceAlreadyInitializedError)
    })

    it('should throw when getInstance is called before initInstance', () => {
        throws(() => SingletonServiceManager.getInstance(), AmazonQServiceInitializationError)
    })

    it('should not throw when getInstance is called after initInstance', () => {
        const singletonServiceManagerInstance = SingletonServiceManager.initInstance(testFeatures)

        deepStrictEqual(SingletonServiceManager.getInstance(), singletonServiceManagerInstance)
    })
}
