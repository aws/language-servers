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
                        name: 'com.example/test-server',
                        description: 'Test server',
                        version: '1.0.0',
                        remotes: [{ type: 'streamable-http', url: 'https://example.com' }],
                    },
                ],
            }

            requestContentStub.resolves(JSON.stringify(mockRegistry))

            const result = await service.fetchRegistry('https://example.com/registry.json')

            assert.notStrictEqual(result, null)
            assert.strictEqual(result?.servers.length, 1)
            assert.strictEqual(result?.url, 'https://example.com/registry.json')
        })

        it('should return null for invalid URL', async () => {
            const result = await service.fetchRegistry('http://example.com/registry.json')
            assert.strictEqual(result, null)
        })

        it('should return null for missing servers array', async () => {
            requestContentStub.resolves('{}')

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

            requestContentStub.resolves(JSON.stringify(mockRegistry))

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

            requestContentStub.resolves(JSON.stringify(mockRegistry))

            await service.fetchRegistry('https://example.com/registry.json')
            assert.strictEqual(service.isRegistryActive(), true)
        })
    })
})
