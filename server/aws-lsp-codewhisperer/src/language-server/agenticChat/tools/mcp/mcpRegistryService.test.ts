/*! * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { McpRegistryService } from './mcpRegistryService'
import { Logging } from '@aws/language-server-runtimes/server-interface'
import * as assert from 'assert'
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon'
import { httpsUtils } from '@aws/lsp-core'
import { MCP_REGISTRY_CONSTANTS } from './mcpRegistryConstants'

describe('McpRegistryService', () => {
    let service: McpRegistryService
    let mockLogging: StubbedInstance<Logging>
    let requestContentStub: sinon.SinonStub

    beforeEach(() => {
        mockLogging = stubInterface<Logging>()
        service = new McpRegistryService(mockLogging)
        requestContentStub = sinon.stub(httpsUtils, 'requestContent')
    })

    afterEach(() => {
        sinon.restore()
    })

    describe('validateRegistryUrl', () => {
        it('should accept valid HTTPS URLs', () => {
            assert.strictEqual(service.validateRegistryUrl('https://example.com/registry.json'), true)
        })

        it('should reject HTTP URLs', () => {
            assert.strictEqual(service.validateRegistryUrl('http://example.com/registry.json'), false)
        })

        it('should reject URLs over 1024 characters', () => {
            const longUrl = 'https://example.com/' + 'a'.repeat(MCP_REGISTRY_CONSTANTS.MAX_REGISTRY_URL_LENGTH)
            assert.strictEqual(service.validateRegistryUrl(longUrl), false)
        })

        it('should reject empty URLs', () => {
            assert.strictEqual(service.validateRegistryUrl(''), false)
        })
    })

    describe('fetchRegistry', () => {
        it('should fetch and parse valid registry JSON', async () => {
            const mockRegistry = {
                servers: [
                    {
                        name: 'test-server',
                        description: 'Test server',
                        version: '1.0.0',
                        remotes: [{ type: 'streamable-http', url: 'https://example.com' }],
                    },
                ],
            }

            requestContentStub.resolves({ content: JSON.stringify(mockRegistry), contentType: 'application/json' })

            const result = await service.fetchRegistry('https://example.com/registry.json')

            assert.notStrictEqual(result, null)
            assert.strictEqual(result?.servers.length, 1)
            assert.strictEqual(result?.url, 'https://example.com/registry.json')
        })

        it('should handle registry with server wrapper structure', async () => {
            const mockRegistry = {
                servers: [
                    {
                        server: {
                            name: 'test-server',
                            description: 'Test server',
                            version: '1.0.0',
                            remotes: [{ type: 'streamable-http', url: 'https://example.com' }],
                        },
                    },
                ],
            }

            requestContentStub.resolves({ content: JSON.stringify(mockRegistry), contentType: 'application/json' })

            const result = await service.fetchRegistry('https://example.com/registry.json')

            assert.notStrictEqual(result, null)
            assert.strictEqual(result?.servers.length, 1)
            assert.strictEqual(result?.servers[0].name, 'test-server')
            assert.strictEqual(result?.url, 'https://example.com/registry.json')
        })

        it('should return null for invalid URL', async () => {
            const result = await service.fetchRegistry('http://example.com/registry.json')
            assert.strictEqual(result, null)
        })

        it('should return null for missing servers array', async () => {
            requestContentStub.resolves({ content: '{}', contentType: 'application/json' })

            const result = await service.fetchRegistry('https://example.com/registry.json')
            assert.strictEqual(result, null)
        })

        it('should handle network errors', async () => {
            requestContentStub.rejects(new Error('Network error'))

            const result = await service.fetchRegistry('https://example.com/registry.json')
            assert.strictEqual(result, null)
        })
    })

    describe('getInMemoryRegistry', () => {
        it('should return null initially', () => {
            assert.strictEqual(service.getInMemoryRegistry(), null)
        })

        it('should return registry after successful fetch', async () => {
            const mockRegistry = {
                servers: [
                    {
                        name: 'test',
                        description: 'Test',
                        version: '1.0.0',
                        remotes: [{ type: 'streamable-http', url: 'https://example.com' }],
                    },
                ],
            }

            requestContentStub.resolves({ content: JSON.stringify(mockRegistry), contentType: 'application/json' })

            await service.fetchRegistry('https://example.com/registry.json')
            const result = service.getInMemoryRegistry()

            assert.notStrictEqual(result, null)
            assert.strictEqual(result?.servers.length, 1)
        })
    })

    describe('isRegistryActive', () => {
        it('should return false initially', () => {
            assert.strictEqual(service.isRegistryActive(), false)
        })

        it('should return true after successful fetch', async () => {
            const mockRegistry = {
                servers: [],
            }

            requestContentStub.resolves({ content: JSON.stringify(mockRegistry), contentType: 'application/json' })

            await service.fetchRegistry('https://example.com/registry.json')
            assert.strictEqual(service.isRegistryActive(), true)
        })
    })

    describe('error handling and logging', () => {
        it('should log error for empty URL', async () => {
            const result = await service.fetchRegistry('')
            assert.strictEqual(result, null)
            assert.ok(mockLogging.error.calledWith('MCP Registry: URL is empty or undefined'))
        })

        it('should log error for URL exceeding max length', async () => {
            const longUrl = 'https://' + 'a'.repeat(1100) + '.com/registry.json'
            const result = await service.fetchRegistry(longUrl)
            assert.strictEqual(result, null)
            assert.ok(mockLogging.error.calledWith(sinon.match(/exceeds maximum length/)))
        })

        it('should log network error for ENOTFOUND', async () => {
            const error = new Error('getaddrinfo ENOTFOUND invalid-domain.com')
            requestContentStub.rejects(error)
            const result = await service.fetchRegistry('https://invalid-domain.com/registry.json')
            assert.strictEqual(result, null)
            assert.ok(mockLogging.error.calledWith(sinon.match(/Network error - unable to reach/)))
        })

        it('should log network error for ECONNREFUSED', async () => {
            const error = new Error('connect ECONNREFUSED 127.0.0.1:443')
            requestContentStub.rejects(error)
            const result = await service.fetchRegistry('https://localhost/registry.json')
            assert.strictEqual(result, null)
            assert.ok(mockLogging.error.calledWith(sinon.match(/Network error - unable to reach/)))
        })

        it('should log error for invalid JSON', async () => {
            requestContentStub.resolves({ content: '{ invalid json }', contentType: 'application/json' })
            const result = await service.fetchRegistry('https://example.com/registry.json')
            assert.strictEqual(result, null)
            assert.ok(mockLogging.error.calledWith(sinon.match(/Invalid JSON format/)))
        })

        it('should log error for non-array servers field', async () => {
            requestContentStub.resolves({ content: '{"servers": "not-an-array"}', contentType: 'application/json' })
            const result = await service.fetchRegistry('https://example.com/registry.json')
            assert.strictEqual(result, null)
            assert.ok(
                mockLogging.error.calledWith(sinon.match(/Invalid registry format.*Registry must have a servers array/))
            )
        })

        it('should log success message with server count', async () => {
            const validRegistry = JSON.stringify({
                servers: [
                    {
                        name: 'test-server',
                        description: 'Test server',
                        version: '1.0.0',
                        remotes: [{ type: 'streamable-http', url: 'https://example.com' }],
                    },
                ],
            })
            requestContentStub.resolves({ content: validRegistry, contentType: 'application/json' })
            const result = await service.fetchRegistry('https://example.com/registry.json')
            assert.ok(result !== null)
            assert.ok(mockLogging.info.calledWith(sinon.match(/Successfully fetched registry.*with 1 servers/)))
        })

        it('should log generic error for unknown failures', async () => {
            const error = new Error('Unknown error occurred')
            requestContentStub.rejects(error)
            const result = await service.fetchRegistry('https://example.com/registry.json')
            assert.strictEqual(result, null)
            assert.ok(mockLogging.error.calledWith(sinon.match(/Failed to fetch registry.*Unknown error occurred/)))
        })

        it('should log authentication error for 401 Unauthorized', async () => {
            const error = new Error('HTTP 401 Unauthorized')
            requestContentStub.rejects(error)
            const result = await service.fetchRegistry('https://example.com/registry.json')
            assert.strictEqual(result, null)
            assert.ok(
                mockLogging.error.calledWith(
                    sinon.match(/Authentication required - registry URL must be accessible without credentials/)
                )
            )
        })

        it('should log authentication error for 403 Forbidden', async () => {
            const error = new Error('HTTP 403 Forbidden')
            requestContentStub.rejects(error)
            const result = await service.fetchRegistry('https://example.com/registry.json')
            assert.strictEqual(result, null)
            assert.ok(
                mockLogging.error.calledWith(
                    sinon.match(/Authentication required - registry URL must be accessible without credentials/)
                )
            )
        })

        it('should log authentication error for Unauthorized message', async () => {
            const error = new Error('Request failed: Unauthorized access')
            requestContentStub.rejects(error)
            const result = await service.fetchRegistry('https://example.com/registry.json')
            assert.strictEqual(result, null)
            assert.ok(
                mockLogging.error.calledWith(
                    sinon.match(/Authentication required - registry URL must be accessible without credentials/)
                )
            )
        })
    })

    describe('performance with large registries', () => {
        it('should handle registry with 200 servers efficiently', async () => {
            const servers = []
            for (let i = 0; i < 200; i++) {
                servers.push({
                    name: `server-${i}`,
                    description: `Server ${i}`,
                    version: '1.0.0',
                    remotes: [{ type: 'streamable-http', url: `https://example.com/${i}` }],
                })
            }

            requestContentStub.resolves({ content: JSON.stringify({ servers }), contentType: 'application/json' })
            const result = await service.fetchRegistry('https://example.com/registry.json')

            assert.notStrictEqual(result, null)
            assert.strictEqual(result?.servers.length, 200)

            // Verify lookup works
            const server = service.getServerByName('server-150')
            assert.notStrictEqual(server, undefined)
            assert.strictEqual(server.name, 'server-150')
        })

        it('should handle registry with 500 servers efficiently', async () => {
            const servers = []
            for (let i = 0; i < 500; i++) {
                servers.push({
                    name: `server-${i}`,
                    description: `Server ${i}`,
                    version: '1.0.0',
                    remotes: [{ type: 'streamable-http', url: `https://example.com/${i}` }],
                })
            }

            requestContentStub.resolves({ content: JSON.stringify({ servers }), contentType: 'application/json' })
            const result = await service.fetchRegistry('https://example.com/registry.json')

            assert.notStrictEqual(result, null)
            assert.strictEqual(result?.servers.length, 500)

            // Verify lookup works
            const server = service.getServerByName('server-499')
            assert.notStrictEqual(server, undefined)
            assert.strictEqual(server.name, 'server-499')
        })

        it('should handle registry with mixed server types', async () => {
            const servers = []
            for (let i = 0; i < 200; i++) {
                if (i % 2 === 0) {
                    servers.push({
                        name: `server-${i}`,
                        description: `Remote server ${i}`,
                        version: '1.0.0',
                        remotes: [{ type: 'streamable-http', url: `https://example.com/${i}` }],
                    })
                } else {
                    servers.push({
                        name: `server-${i}`,
                        description: `Local server ${i}`,
                        version: '1.0.0',
                        packages: [
                            {
                                registryType: 'npm',
                                identifier: `@test/server-${i}`,
                                version: '1.0.0',
                                transport: { type: 'stdio' },
                            },
                        ],
                    })
                }
            }

            requestContentStub.resolves({ content: JSON.stringify({ servers }), contentType: 'application/json' })
            const result = await service.fetchRegistry('https://example.com/registry.json')

            assert.notStrictEqual(result, null)
            assert.strictEqual(result?.servers.length, 200)
        })
    })
})
