import { expect, use } from 'chai'
import { StubbedInstance, stubInterface } from 'ts-sinon'
import { Observability } from '@aws/lsp-core'
import { Logging, Telemetry } from '@aws/language-server-runtimes/server-interface'
import { restore, stub } from 'sinon'
import { NotificationService } from './notificationService'
import { Fetcher } from '../notifications/fetchers/fetcher'
import { MetadataStore } from '../notifications/metadata/metadataStore'
import { NotificationClient } from './notificationServer'

// eslint-disable-next-line @typescript-eslint/no-var-requires
use(require('chai-as-promised'))

describe('NotificationService', () => {
    let observability: StubbedInstance<Observability>
    let fetcher: StubbedInstance<Fetcher>
    let metadataStore: StubbedInstance<MetadataStore>
    let notificationClient: StubbedInstance<NotificationClient>
    let service: NotificationService

    beforeEach(() => {
        // Setup stubs
        observability = stubInterface<Observability>()
        observability.logging = stubInterface<Logging>()
        observability.telemetry = stubInterface<Telemetry>()

        fetcher = stubInterface<Fetcher>()
        metadataStore = stubInterface<MetadataStore>()
        notificationClient = stubInterface<NotificationClient>()

        // Create service with periodic notifications disabled for testing
        service = new NotificationService(fetcher, metadataStore, notificationClient, observability, {
            periodicShowNotifications: false,
        })
    })

    afterEach(() => {
        restore()
    })

    describe('updateFetcher', () => {
        it('should update the fetcher and show notifications', async () => {
            // Create a new fetcher
            const newFetcher = stubInterface<Fetcher>()

            // Setup mock async generator for the new fetcher
            const mockAsyncGenerator = async function* () {
                yield {
                    id: 'test-notification',
                    content: {
                        'en-US': {
                            title: 'Test Title',
                            text: 'Test Text',
                        },
                    },
                }
            }
            newFetcher.fetch.returns(mockAsyncGenerator())

            // Stub showNotifications method
            const showNotificationsStub = stub(service as any, 'showNotifications').resolves()

            // Call updateFetcher
            await service.updateFetcher(newFetcher)

            // Verify the fetcher was updated
            expect((service as any).fetcher).to.equal(newFetcher)

            // Verify showNotifications was called
            expect(showNotificationsStub.calledOnce).to.be.true
        })
    })

    describe('showNotifications', () => {
        it('should fetch and show notifications', async () => {
            // Setup mock async generator for the fetcher
            const notification = {
                id: 'test-notification',
                content: {
                    'en-US': {
                        title: 'Test Title',
                        text: 'Test Text',
                    },
                },
            }

            const mockAsyncGenerator = async function* () {
                yield notification
            }
            fetcher.fetch.returns(mockAsyncGenerator())

            // Call showNotifications
            await (service as any).showNotifications()

            // Verify showNotification was called with the correct parameters
            expect(notificationClient.showNotification.calledOnce).to.be.true
            expect(notificationClient.showNotification.firstCall.args[0]).to.deep.include({
                id: 'test-notification',
                content: {
                    title: 'Test Title',
                    text: 'Test Text',
                },
            })
        })
    })
})
