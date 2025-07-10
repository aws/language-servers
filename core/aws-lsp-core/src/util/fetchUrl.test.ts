import { fetchUrl } from './fetchUrl'
import { Workspace } from '@aws/language-server-runtimes/server-interface'
import * as http from 'http'
import * as https from 'https'
import * as sinon from 'sinon'
import { expect, use } from 'chai'
import * as chaiAsPromised from 'chai-as-promised'

use(chaiAsPromised)

describe('fetchUrl', function () {
    let httpRequestStub: sinon.SinonStub
    let httpsRequestStub: sinon.SinonStub
    let mockWorkspace: Workspace

    beforeEach(function () {
        // Create stubs for http and https modules
        httpRequestStub = sinon.stub(http, 'request')
        httpsRequestStub = sinon.stub(https, 'request')

        // Mock workspace
        mockWorkspace = {
            fs: {
                exists: sinon.stub(),
                readFile: sinon.stub(),
            },
        } as unknown as Workspace
    })

    afterEach(function () {
        sinon.restore()
    })

    describe('file protocol', function () {
        it('should fetch content from file system using workspace.fs', async function () {
            const fileUrl = 'file:///path/to/file.json'
            const fileContent = '{"key": "value"}'

            // Mock workspace.fs methods
            ;(mockWorkspace.fs.exists as sinon.SinonStub).resolves(true)
            ;(mockWorkspace.fs.readFile as sinon.SinonStub).resolves(fileContent)

            const result = await fetchUrl(fileUrl, mockWorkspace)

            expect((mockWorkspace.fs.exists as sinon.SinonStub).calledWith('/path/to/file.json')).to.be.true
            expect((mockWorkspace.fs.readFile as sinon.SinonStub).calledWith('/path/to/file.json')).to.be.true
            expect(result).to.deep.equal({
                body: fileContent,
            })
        })

        it('should throw an error if file does not exist', async function () {
            const fileUrl = 'file:///path/to/nonexistent.json'

            // Mock workspace.fs methods
            ;(mockWorkspace.fs.exists as sinon.SinonStub).resolves(false)

            await expect(fetchUrl(fileUrl, mockWorkspace)).to.be.rejectedWith('File not found')
        })

        it('should handle Windows file paths correctly', async function () {
            const originalPlatform = process.platform
            Object.defineProperty(process, 'platform', { value: 'win32' })

            const fileUrl = 'file:///C:/path/to/file.json'
            const fileContent = '{"key": "value"}'

            // Mock workspace.fs methods
            ;(mockWorkspace.fs.exists as sinon.SinonStub).resolves(true)
            ;(mockWorkspace.fs.readFile as sinon.SinonStub).resolves(fileContent)

            const result = await fetchUrl(fileUrl, mockWorkspace)

            expect((mockWorkspace.fs.exists as sinon.SinonStub).calledWith('C:/path/to/file.json')).to.be.true
            expect((mockWorkspace.fs.readFile as sinon.SinonStub).calledWith('C:/path/to/file.json')).to.be.true
            expect(result).to.deep.equal({
                body: fileContent,
            })

            // Restore original platform
            Object.defineProperty(process, 'platform', { value: originalPlatform })
        })
    })

    describe('http/https protocol', function () {
        it('should fetch content from http URL', async function () {
            const httpUrl = 'http://example.com/data.json'
            const httpContent = '{"key": "value"}'

            // Create mock response
            const mockResponse = {
                statusCode: 200,
                headers: { 'content-type': 'application/json' },
                on: sinon.stub(),
            }

            // Set up response event handlers
            mockResponse.on.withArgs('data').callsArgWith(1, Buffer.from(httpContent))
            mockResponse.on.withArgs('end').callsArg(1)
            mockResponse.on.returns(mockResponse)

            // Create mock request
            const mockRequest = {
                on: sinon.stub().returnsThis(),
                end: sinon.stub(),
            }

            httpRequestStub.callsArgWith(1, mockResponse).returns(mockRequest)

            const result = await fetchUrl(httpUrl, mockWorkspace)

            expect(httpRequestStub.called).to.be.true
            expect(mockRequest.end.called).to.be.true
            expect(result).to.deep.equal({
                body: httpContent,
                statusCode: 200,
                headers: { 'content-type': 'application/json' },
            })
        })

        it('should fetch content from https URL', async function () {
            const httpsUrl = 'https://example.com/data.json'
            const httpsContent = '{"key": "value"}'

            // Create mock response
            const mockResponse = {
                statusCode: 200,
                headers: { 'content-type': 'application/json' },
                on: sinon.stub(),
            }

            // Set up response event handlers
            mockResponse.on.withArgs('data').callsArgWith(1, Buffer.from(httpsContent))
            mockResponse.on.withArgs('end').callsArg(1)
            mockResponse.on.returns(mockResponse)

            // Create mock request
            const mockRequest = {
                on: sinon.stub().returnsThis(),
                end: sinon.stub(),
            }

            httpsRequestStub.callsArgWith(1, mockResponse).returns(mockRequest)

            const result = await fetchUrl(httpsUrl, mockWorkspace)

            expect(httpsRequestStub.called).to.be.true
            expect(mockRequest.end.called).to.be.true
            expect(result).to.deep.equal({
                body: httpsContent,
                statusCode: 200,
                headers: { 'content-type': 'application/json' },
            })
        })

        it('should handle request errors', async function () {
            const httpUrl = 'http://example.com/data.json'

            // Create mock request with error
            const mockRequest = {
                on: sinon.stub(),
                end: sinon.stub(),
            }

            mockRequest.on.withArgs('error').callsArgWith(1, new Error('Network error'))
            mockRequest.on.returnsThis()

            httpRequestStub.returns(mockRequest)

            await expect(fetchUrl(httpUrl, mockWorkspace)).to.be.rejectedWith('HTTP request failed: Network error')
        })

        it('should handle timeouts', async function () {
            const httpUrl = 'http://example.com/data.json'
            const options = { timeout: 1000 }

            // Create mock request with timeout
            const mockRequest = {
                on: sinon.stub(),
                end: sinon.stub(),
                destroy: sinon.stub(),
            }

            mockRequest.on.withArgs('timeout').callsArg(1)
            mockRequest.on.returnsThis()

            httpRequestStub.returns(mockRequest)

            await expect(fetchUrl(httpUrl, mockWorkspace, options)).to.be.rejectedWith('Request timed out after 1000ms')
            expect(mockRequest.destroy.called).to.be.true
        })
    })

    describe('unsupported protocol', function () {
        it('should throw an error for unsupported protocols', async function () {
            const ftpUrl = 'ftp://example.com/file.txt'

            await expect(fetchUrl(ftpUrl, mockWorkspace)).to.be.rejectedWith('Unsupported protocol: ftp:')
        })
    })
})
