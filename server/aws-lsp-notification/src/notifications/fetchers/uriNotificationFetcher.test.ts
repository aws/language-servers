import { UriNotificationFetcher } from './uriNotificationFetcher'
import { UriResolver } from '@aws/lsp-core'
import { Logging } from '@aws/language-server-runtimes/server-interface'
import { expect } from 'chai'
import * as sinon from 'sinon'

describe('UriNotificationFetcher', () => {
    let mockUriResolver: sinon.SinonStub<[string], Promise<string>>
    let mockLogging: Logging

    beforeEach(() => {
        // Create stub for UriResolver
        mockUriResolver = sinon.stub<[string], Promise<string>>()

        // Mock logging
        mockLogging = {
            debug: sinon.stub(),
            error: sinon.stub(),
            info: sinon.stub(),
            log: sinon.stub(),
            warn: sinon.stub(),
        }
    })

    afterEach(() => {
        sinon.restore()
    })

    it('should fetch and yield notifications from an array response', async () => {
        // Sample notifications
        const sampleNotifications = [
            { id: '1', content: { 'en-US': { title: 'Title 1', text: 'Text 1' } } },
            { id: '2', content: { 'en-US': { title: 'Title 2', text: 'Text 2' } } },
        ]

        // Mock UriResolver to return an array of notifications
        mockUriResolver.resolves(JSON.stringify(sampleNotifications))

        // Create fetcher with a test URL
        const fetcher = new UriNotificationFetcher(mockUriResolver, 'https://test.com/notifications.json', mockLogging)

        // Collect notifications from the generator
        const notifications = []
        for await (const notification of fetcher.fetch()) {
            notifications.push(notification)
        }

        // Verify UriResolver was called correctly
        expect(mockUriResolver.calledWith('https://test.com/notifications.json')).to.be.true

        // Verify the notifications were yielded correctly
        expect(notifications).to.deep.equal(sampleNotifications)
    })

    it('should fetch and yield notifications from an object with notifications property', async () => {
        // Sample response
        const sampleResponse = {
            notifications: [
                { id: '1', content: { 'en-US': { title: 'Title 1', text: 'Text 1' } } },
                { id: '2', content: { 'en-US': { title: 'Title 2', text: 'Text 2' } } },
            ],
        }

        // Mock UriResolver to return an object with notifications property
        mockUriResolver.resolves(JSON.stringify(sampleResponse))

        // Create fetcher with a test URL
        const fetcher = new UriNotificationFetcher(mockUriResolver, 'https://test.com/notifications.json', mockLogging)

        // Collect notifications from the generator
        const notifications = []
        for await (const notification of fetcher.fetch()) {
            notifications.push(notification)
        }

        // Verify the notifications were yielded correctly
        expect(notifications).to.deep.equal(sampleResponse.notifications)
    })

    it('should fetch and yield a single notification object', async () => {
        // Sample notification
        const sampleNotification = { id: '1', content: { 'en-US': { title: 'Title 1', text: 'Text 1' } } }

        // Mock UriResolver to return a single notification
        mockUriResolver.resolves(JSON.stringify(sampleNotification))

        // Create fetcher with a test URL
        const fetcher = new UriNotificationFetcher(mockUriResolver, 'https://test.com/notifications.json', mockLogging)

        // Collect notifications from the generator
        const notifications = []
        for await (const notification of fetcher.fetch()) {
            notifications.push(notification)
        }

        // Verify the notification was yielded correctly
        expect(notifications).to.deep.equal([sampleNotification])
    })

    it('should handle errors and log them', async () => {
        // Mock UriResolver to throw an error
        mockUriResolver.rejects(new Error('Network error'))

        // Create fetcher with a test URL
        const fetcher = new UriNotificationFetcher(mockUriResolver, 'https://test.com/notifications.json', mockLogging)

        // Collect notifications from the generator
        const notifications = []
        for await (const notification of fetcher.fetch()) {
            notifications.push(notification)
        }

        // Verify no notifications were yielded
        expect(notifications).to.deep.equal([])

        // Verify error was logged
        expect((mockLogging.error as sinon.SinonStub).calledWith(sinon.match.string)).to.be.true
    })

    it('should handle JSON parsing errors', async () => {
        // Mock UriResolver to return invalid JSON
        mockUriResolver.resolves('Not valid JSON')

        // Create fetcher with a test URL
        const fetcher = new UriNotificationFetcher(mockUriResolver, 'https://test.com/notifications.json', mockLogging)

        // Collect notifications from the generator
        const notifications = []
        for await (const notification of fetcher.fetch()) {
            notifications.push(notification)
        }

        // Verify no notifications were yielded
        expect(notifications).to.deep.equal([])

        // Verify error was logged
        expect((mockLogging.error as sinon.SinonStub).called).to.be.true
    })
})
