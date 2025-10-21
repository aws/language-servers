/*! * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { McpRegistryService } from './mcpRegistryService'
import { Logging } from '@aws/language-server-runtimes/server-interface'
import * as https from 'https'

jest.mock('https')

describe('McpRegistryService', () => {
    let service: McpRegistryService
    let mockLogging: jest.Mocked<Logging>

    beforeEach(() => {
        mockLogging = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            log: jest.fn(),
        } as any
        service = new McpRegistryService(mockLogging)
    })

    describe('validateRegistryUrl', () => {
        it('should accept valid HTTPS URLs', () => {
            expect(service.validateRegistryUrl('https://example.com/registry.json')).toBe(true)
        })

        it('should reject HTTP URLs', () => {
            expect(service.validateRegistryUrl('http://example.com/registry.json')).toBe(false)
        })

        it('should reject URLs over 1024 characters', () => {
            const longUrl = 'https://example.com/' + 'a'.repeat(1020)
            expect(service.validateRegistryUrl(longUrl)).toBe(false)
        })

        it('should reject empty URLs', () => {
            expect(service.validateRegistryUrl('')).toBe(false)
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

            const mockResponse = {
                statusCode: 200,
                on: jest.fn((event, handler) => {
                    if (event === 'data') handler(JSON.stringify(mockRegistry))
                    if (event === 'end') handler()
                    return mockResponse
                }),
            }

            ;(https.get as jest.Mock).mockImplementation((url, callback) => {
                callback(mockResponse)
                return { on: jest.fn() }
            })

            const result = await service.fetchRegistry('https://example.com/registry.json')

            expect(result).not.toBeNull()
            expect(result?.servers).toHaveLength(1)
            expect(result?.url).toBe('https://example.com/registry.json')
        })

        it('should return null for invalid URL', async () => {
            const result = await service.fetchRegistry('http://example.com/registry.json')
            expect(result).toBeNull()
        })

        it('should return null for missing servers array', async () => {
            const mockResponse = {
                statusCode: 200,
                on: jest.fn((event, handler) => {
                    if (event === 'data') handler('{}')
                    if (event === 'end') handler()
                    return mockResponse
                }),
            }

            ;(https.get as jest.Mock).mockImplementation((url, callback) => {
                callback(mockResponse)
                return { on: jest.fn() }
            })

            const result = await service.fetchRegistry('https://example.com/registry.json')
            expect(result).toBeNull()
        })

        it('should handle network errors', async () => {
            ;(https.get as jest.Mock).mockImplementation(() => {
                return {
                    on: jest.fn((event, handler) => {
                        if (event === 'error') handler(new Error('Network error'))
                    }),
                }
            })

            const result = await service.fetchRegistry('https://example.com/registry.json')
            expect(result).toBeNull()
        })
    })

    describe('getInMemoryRegistry', () => {
        it('should return null initially', () => {
            expect(service.getInMemoryRegistry()).toBeNull()
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

            const mockResponse = {
                statusCode: 200,
                on: jest.fn((event, handler) => {
                    if (event === 'data') handler(JSON.stringify(mockRegistry))
                    if (event === 'end') handler()
                    return mockResponse
                }),
            }

            ;(https.get as jest.Mock).mockImplementation((url, callback) => {
                callback(mockResponse)
                return { on: jest.fn() }
            })

            await service.fetchRegistry('https://example.com/registry.json')
            const result = service.getInMemoryRegistry()

            expect(result).not.toBeNull()
            expect(result?.servers).toHaveLength(1)
        })
    })

    describe('isRegistryActive', () => {
        it('should return false initially', () => {
            expect(service.isRegistryActive()).toBe(false)
        })

        it('should return true after successful fetch', async () => {
            const mockRegistry = {
                servers: [],
            }

            const mockResponse = {
                statusCode: 200,
                on: jest.fn((event, handler) => {
                    if (event === 'data') handler(JSON.stringify(mockRegistry))
                    if (event === 'end') handler()
                    return mockResponse
                }),
            }

            ;(https.get as jest.Mock).mockImplementation((url, callback) => {
                callback(mockResponse)
                return { on: jest.fn() }
            })

            await service.fetchRegistry('https://example.com/registry.json')
            expect(service.isRegistryActive()).toBe(true)
        })
    })
})
