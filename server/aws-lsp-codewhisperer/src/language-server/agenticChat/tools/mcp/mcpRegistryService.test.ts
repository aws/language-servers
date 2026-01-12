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
            assert.throws(
                () => service.validateRegistryUrl('http://example.com/registry.json'),
                /MCP Registry:.*URL must be a valid HTTPS URL/
            )
        })

        it('should reject URLs over 1024 characters', () => {
            const longUrl = 'https://example.com/' + 'a'.repeat(MCP_REGISTRY_CONSTANTS.MAX_REGISTRY_URL_LENGTH)
            assert.throws(() => service.validateRegistryUrl(longUrl), /MCP Registry:.*exceeds maximum length/)
        })

        it('should reject empty URLs', () => {
            assert.throws(() => service.validateRegistryUrl(''), /MCP Registry:.*URL is empty or undefined/)
        })

        it('should accept URLs with query parameters', () => {
            assert.strictEqual(service.validateRegistryUrl('https://example.com/registry?version=1&format=json'), true)
        })

        it('should accept URLs with fragments', () => {
            assert.strictEqual(service.validateRegistryUrl('https://example.com/registry.json#section'), true)
        })

        it('should accept URLs with ports', () => {
            assert.strictEqual(service.validateRegistryUrl('https://example.com:8443/registry.json'), true)
        })

        it('should accept URLs with authentication', () => {
            assert.strictEqual(service.validateRegistryUrl('https://user@example.com/registry.json'), true)
        })

        it('should accept URLs with hyphens in domain', () => {
            assert.strictEqual(service.validateRegistryUrl('https://my-server.example.com/registry.json'), true)
        })

        it('should accept URLs with underscores in path', () => {
            assert.strictEqual(service.validateRegistryUrl('https://example.com/mcp_registry.json'), true)
        })

        it('should accept URLs with percent encoding', () => {
            assert.strictEqual(service.validateRegistryUrl('https://example.com/registry%20file.json'), true)
        })

        it('should accept URLs with brackets (IPv6)', () => {
            assert.strictEqual(service.validateRegistryUrl('https://[2001:db8::1]/registry.json'), true)
        })

        it('should accept URLs with special characters in query', () => {
            assert.strictEqual(service.validateRegistryUrl('https://example.com/registry?key=value&other=test'), true)
        })

        it('should accept URLs with subdelimiters', () => {
            assert.strictEqual(service.validateRegistryUrl("https://example.com/path!$&'()*+,;=test"), true)
        })

        it('should reject URLs with spaces', () => {
            assert.throws(
                () => service.validateRegistryUrl('https://example.com/registry file.json'),
                /MCP Registry:.*URL must be a valid HTTPS URL/
            )
        })

        it('should reject URLs with invalid characters', () => {
            assert.throws(
                () => service.validateRegistryUrl('https://example.com/registry<>.json'),
                /MCP Registry:.*URL must be a valid HTTPS URL/
            )
        })

        it('should reject URLs with backslashes', () => {
            assert.throws(
                () => service.validateRegistryUrl('https://example.com\\registry.json'),
                /MCP Registry:.*URL must be a valid HTTPS URL/
            )
        })

        it('should reject URLs with pipes', () => {
            assert.throws(
                () => service.validateRegistryUrl('https://example.com/registry|file.json'),
                /MCP Registry:.*URL must be a valid HTTPS URL/
            )
        })

        it('should reject FTP URLs', () => {
            assert.throws(
                () => service.validateRegistryUrl('ftp://example.com/registry.json'),
                /MCP Registry:.*URL must be a valid HTTPS URL/
            )
        })

        it('should reject URLs without protocol', () => {
            assert.throws(
                () => service.validateRegistryUrl('example.com/registry.json'),
                /MCP Registry:.*URL must be a valid HTTPS URL/
            )
        })

        it('should reject URLs with only https:', () => {
            assert.throws(() => service.validateRegistryUrl('https:'), /MCP Registry:.*URL must be a valid HTTPS URL/)
        })

        it('should reject URLs with https:/ (single slash)', () => {
            assert.throws(
                () => service.validateRegistryUrl('https:/example.com/registry.json'),
                /MCP Registry:.*URL must be a valid HTTPS URL/
            )
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

        it('should throw error for invalid URL', async () => {
            await assert.rejects(
                () => service.fetchRegistry('http://example.com/registry.json'),
                /MCP Registry:.*URL must be a valid HTTPS URL/
            )
        })

        it('should throw error for missing servers array', async () => {
            requestContentStub.resolves({ content: '{}', contentType: 'application/json' })

            await assert.rejects(
                () => service.fetchRegistry('https://example.com/registry.json'),
                /MCP Registry:.*Registry must have a servers array/
            )
        })

        it('should handle network errors', async () => {
            requestContentStub.rejects(new Error('Network error'))

            await assert.rejects(
                () => service.fetchRegistry('https://example.com/registry.json'),
                /MCP Registry:.*Failed to fetch registry.*Network error/
            )
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
        it('should throw error for empty URL', async () => {
            await assert.rejects(() => service.fetchRegistry(''), /MCP Registry:.*URL is empty or undefined/)
            assert.ok(mockLogging.error.calledWith('MCP Registry: URL is empty or undefined (URL: )'))
        })

        it('should throw error for URL exceeding max length', async () => {
            const longUrl = 'https://' + 'a'.repeat(1100) + '.com/registry.json'
            await assert.rejects(() => service.fetchRegistry(longUrl), /MCP Registry:.*exceeds maximum length/)
            assert.ok(mockLogging.error.calledWith(sinon.match(/exceeds maximum length/)))
        })

        it('should throw network error for ENOTFOUND', async () => {
            const error = new Error('getaddrinfo ENOTFOUND invalid-domain.com')
            requestContentStub.rejects(error)
            await assert.rejects(
                () => service.fetchRegistry('https://invalid-domain.com/registry.json'),
                /MCP Registry:.*Network error - unable to reach/
            )
            assert.ok(mockLogging.error.calledWith(sinon.match(/Network error - unable to reach/)))
        })

        it('should throw network error for ECONNREFUSED', async () => {
            const error = new Error('connect ECONNREFUSED 127.0.0.1:443')
            requestContentStub.rejects(error)
            await assert.rejects(
                () => service.fetchRegistry('https://localhost/registry.json'),
                /MCP Registry:.*Network error - unable to reach/
            )
            assert.ok(mockLogging.error.calledWith(sinon.match(/Network error - unable to reach/)))
        })

        it('should throw error for invalid JSON', async () => {
            requestContentStub.resolves({ content: '{ invalid json }', contentType: 'application/json' })
            await assert.rejects(
                () => service.fetchRegistry('https://example.com/registry.json'),
                /MCP Registry:.*Invalid JSON format/
            )
            assert.ok(mockLogging.error.calledWith(sinon.match(/Invalid JSON format/)))
        })

        it('should throw error for non-array servers field', async () => {
            requestContentStub.resolves({ content: '{"servers": "not-an-array"}', contentType: 'application/json' })
            await assert.rejects(
                () => service.fetchRegistry('https://example.com/registry.json'),
                /MCP Registry:.*Invalid registry format.*Registry must have a servers array/
            )
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

        it('should throw generic error for unknown failures', async () => {
            const error = new Error('Unknown error occurred')
            requestContentStub.rejects(error)
            await assert.rejects(
                () => service.fetchRegistry('https://example.com/registry.json'),
                /MCP Registry:.*Failed to fetch registry.*Unknown error occurred/
            )
            assert.ok(mockLogging.error.calledWith(sinon.match(/Failed to fetch registry.*Unknown error occurred/)))
        })

        it('should throw authentication error for 401 Unauthorized', async () => {
            const error = new Error('HTTP 401 Unauthorized')
            requestContentStub.rejects(error)
            await assert.rejects(
                () => service.fetchRegistry('https://example.com/registry.json'),
                /MCP Registry:.*Authentication required/
            )
            assert.ok(
                mockLogging.error.calledWith(
                    sinon.match(/Authentication required - registry URL must be accessible without credentials/)
                )
            )
        })

        it('should throw authentication error for 403 Forbidden', async () => {
            const error = new Error('HTTP 403 Forbidden')
            requestContentStub.rejects(error)
            await assert.rejects(
                () => service.fetchRegistry('https://example.com/registry.json'),
                /MCP Registry:.*Authentication required/
            )
            assert.ok(
                mockLogging.error.calledWith(
                    sinon.match(/Authentication required - registry URL must be accessible without credentials/)
                )
            )
        })

        it('should throw authentication error for Unauthorized message', async () => {
            const error = new Error('Request failed: Unauthorized access')
            requestContentStub.rejects(error)
            await assert.rejects(
                () => service.fetchRegistry('https://example.com/registry.json'),
                /MCP Registry:.*Authentication required/
            )
            assert.ok(
                mockLogging.error.calledWith(
                    sinon.match(/Authentication required - registry URL must be accessible without credentials/)
                )
            )
        })
    })

    describe('alphabetical sorting', () => {
        it('should sort servers alphabetically by name', async () => {
            const mockRegistry = {
                servers: [
                    {
                        name: 'zebra',
                        description: 'Z',
                        version: '1.0.0',
                        remotes: [{ type: 'streamable-http', url: 'https://z.com' }],
                    },
                    {
                        name: 'alpha',
                        description: 'A',
                        version: '1.0.0',
                        remotes: [{ type: 'streamable-http', url: 'https://a.com' }],
                    },
                    {
                        name: 'beta',
                        description: 'B',
                        version: '1.0.0',
                        remotes: [{ type: 'streamable-http', url: 'https://b.com' }],
                    },
                ],
            }

            requestContentStub.resolves({ content: JSON.stringify(mockRegistry), contentType: 'application/json' })
            const result = await service.fetchRegistry('https://example.com/registry.json')

            assert.notStrictEqual(result, null)
            assert.strictEqual(result?.servers[0].name, 'alpha')
            assert.strictEqual(result?.servers[1].name, 'beta')
            assert.strictEqual(result?.servers[2].name, 'zebra')
        })

        it('should handle case-insensitive sorting', async () => {
            const mockRegistry = {
                servers: [
                    {
                        name: 'Zebra',
                        description: 'Z',
                        version: '1.0.0',
                        remotes: [{ type: 'streamable-http', url: 'https://z.com' }],
                    },
                    {
                        name: 'alpha',
                        description: 'A',
                        version: '1.0.0',
                        remotes: [{ type: 'streamable-http', url: 'https://a.com' }],
                    },
                    {
                        name: 'BETA',
                        description: 'B',
                        version: '1.0.0',
                        remotes: [{ type: 'streamable-http', url: 'https://b.com' }],
                    },
                ],
            }

            requestContentStub.resolves({ content: JSON.stringify(mockRegistry), contentType: 'application/json' })
            const result = await service.fetchRegistry('https://example.com/registry.json')

            assert.notStrictEqual(result, null)
            assert.strictEqual(result?.servers[0].name, 'alpha')
            assert.strictEqual(result?.servers[1].name, 'BETA')
            assert.strictEqual(result?.servers[2].name, 'Zebra')
        })

        it('should handle numeric sorting naturally', async () => {
            const mockRegistry = {
                servers: [
                    {
                        name: 'server10',
                        description: 'S10',
                        version: '1.0.0',
                        remotes: [{ type: 'streamable-http', url: 'https://s10.com' }],
                    },
                    {
                        name: 'server2',
                        description: 'S2',
                        version: '1.0.0',
                        remotes: [{ type: 'streamable-http', url: 'https://s2.com' }],
                    },
                    {
                        name: 'server1',
                        description: 'S1',
                        version: '1.0.0',
                        remotes: [{ type: 'streamable-http', url: 'https://s1.com' }],
                    },
                ],
            }

            requestContentStub.resolves({ content: JSON.stringify(mockRegistry), contentType: 'application/json' })
            const result = await service.fetchRegistry('https://example.com/registry.json')

            assert.notStrictEqual(result, null)
            assert.strictEqual(result?.servers[0].name, 'server1')
            assert.strictEqual(result?.servers[1].name, 'server2')
            assert.strictEqual(result?.servers[2].name, 'server10')
        })

        it('should handle special characters in names', async () => {
            const mockRegistry = {
                servers: [
                    {
                        name: 'server_z',
                        description: 'Z',
                        version: '1.0.0',
                        remotes: [{ type: 'streamable-http', url: 'https://z.com' }],
                    },
                    {
                        name: 'server-a',
                        description: 'A',
                        version: '1.0.0',
                        remotes: [{ type: 'streamable-http', url: 'https://a.com' }],
                    },
                    {
                        name: 'server.b',
                        description: 'B',
                        version: '1.0.0',
                        remotes: [{ type: 'streamable-http', url: 'https://b.com' }],
                    },
                ],
            }

            requestContentStub.resolves({ content: JSON.stringify(mockRegistry), contentType: 'application/json' })
            const result = await service.fetchRegistry('https://example.com/registry.json')

            assert.notStrictEqual(result, null)
            assert.strictEqual(result?.servers.length, 3)
            // Verify sorting works with special characters
            const names = result?.servers.map(s => s.name)
            assert.ok(names?.includes('server-a'))
            assert.ok(names?.includes('server.b'))
            assert.ok(names?.includes('server_z'))
        })

        it('should handle empty string names gracefully', async () => {
            const mockRegistry = {
                servers: [
                    {
                        name: 'zebra',
                        description: 'Z',
                        version: '1.0.0',
                        remotes: [{ type: 'streamable-http', url: 'https://z.com' }],
                    },
                    {
                        name: '',
                        description: 'Empty',
                        version: '1.0.0',
                        remotes: [{ type: 'streamable-http', url: 'https://empty.com' }],
                    },
                    {
                        name: 'alpha',
                        description: 'A',
                        version: '1.0.0',
                        remotes: [{ type: 'streamable-http', url: 'https://a.com' }],
                    },
                ],
            }

            requestContentStub.resolves({ content: JSON.stringify(mockRegistry), contentType: 'application/json' })

            // Validator will reject servers with empty names, so this should throw an error
            await assert.rejects(
                () => service.fetchRegistry('https://example.com/registry.json'),
                /MCP Registry:.*Invalid registry format/
            )
        })

        it('should handle valid alphanumeric names with hyphens and underscores', async () => {
            const mockRegistry = {
                servers: [
                    {
                        name: 'server_3',
                        description: 'S3',
                        version: '1.0.0',
                        remotes: [{ type: 'streamable-http', url: 'https://s3.com' }],
                    },
                    {
                        name: 'server-1',
                        description: 'S1',
                        version: '1.0.0',
                        remotes: [{ type: 'streamable-http', url: 'https://s1.com' }],
                    },
                    {
                        name: 'server.2',
                        description: 'S2',
                        version: '1.0.0',
                        remotes: [{ type: 'streamable-http', url: 'https://s2.com' }],
                    },
                ],
            }

            requestContentStub.resolves({ content: JSON.stringify(mockRegistry), contentType: 'application/json' })
            const result = await service.fetchRegistry('https://example.com/registry.json')

            assert.notStrictEqual(result, null)
            assert.strictEqual(result?.servers.length, 3)
            // Verify all servers are present and sorted
            const names = result?.servers.map(s => s.name)
            assert.ok(names?.includes('server-1'))
            assert.ok(names?.includes('server.2'))
            assert.ok(names?.includes('server_3'))
        })

        it('should maintain sort stability with error-proof comparison', async () => {
            const mockRegistry = {
                servers: [
                    {
                        name: 'server-z',
                        description: 'Z',
                        version: '1.0.0',
                        remotes: [{ type: 'streamable-http', url: 'https://z.com' }],
                    },
                    {
                        name: 'server-a',
                        description: 'A',
                        version: '1.0.0',
                        remotes: [{ type: 'streamable-http', url: 'https://a.com' }],
                    },
                    {
                        name: 'server-m',
                        description: 'M',
                        version: '1.0.0',
                        remotes: [{ type: 'streamable-http', url: 'https://m.com' }],
                    },
                ],
            }

            requestContentStub.resolves({ content: JSON.stringify(mockRegistry), contentType: 'application/json' })
            const result = await service.fetchRegistry('https://example.com/registry.json')

            assert.notStrictEqual(result, null)
            assert.strictEqual(result?.servers.length, 3)
            assert.strictEqual(result?.servers[0].name, 'server-a')
            assert.strictEqual(result?.servers[1].name, 'server-m')
            assert.strictEqual(result?.servers[2].name, 'server-z')
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
