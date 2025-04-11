import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { CodeWhispererServiceBase } from '../codeWhispererService'
import { AmazonQBaseServiceManager, BaseAmazonQServiceManager } from './BaseAmazonQServiceManager'
import { StreamingClientServiceBase } from '../streamingClientService'
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

    public static getInstance(features: TestFeatures): TestAmazonQServiceManager {
        if (!TestAmazonQServiceManager.instance) {
            TestAmazonQServiceManager.instance = new TestAmazonQServiceManager(features)
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
export const initBaseTestServiceManager = <C extends CodeWhispererServiceBase>(
    features: TestFeatures,
    serviceMock: C
): AmazonQBaseServiceManager => {
    const testServiceManager = TestAmazonQServiceManager.getInstance(features)
    testServiceManager.withCodeWhispererService(serviceMock)

    return testServiceManager
}
