import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { CodeWhispererServiceBase } from '../codeWhispererService'
import { BaseAmazonQServiceManager } from './BaseAmazonQServiceManager'
import { StreamingClientServiceBase } from '../streamingClientService'
import { AmazonQServiceAlreadyInitializedError, AmazonQServiceNotInitializedError } from './errors'

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

        throw new AmazonQServiceAlreadyInitializedError('Test service is already initialized.')
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
