/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert'
import { McpServerConfigConverter } from './mcpServerConfigConverter'
import { McpRegistryServer } from './mcpTypes'

describe('McpServerConfigConverter', () => {
    let converter: McpServerConfigConverter

    beforeEach(() => {
        converter = new McpServerConfigConverter()
    })

    describe('convertRegistryServer', () => {
        it('should convert remote server', () => {
            const registryServer: McpRegistryServer = {
                name: 'test-remote',
                description: 'Test remote server',
                version: '1.0.0',
                remotes: [
                    {
                        type: 'streamable-http',
                        url: 'https://example.com/mcp',
                    },
                ],
            }

            const result = converter.convertRegistryServer(registryServer)

            assert.strictEqual(result.url, 'https://example.com/mcp')
            assert.strictEqual(result.command, undefined)
        })

        it('should convert local npm server with version', () => {
            const registryServer: McpRegistryServer = {
                name: 'test-local',
                description: 'Test local server',
                version: '1.0.0',
                packages: [
                    {
                        registryType: 'npm',
                        identifier: '@example/package',
                        transport: { type: 'stdio' },
                    },
                ],
            }

            const result = converter.convertRegistryServer(registryServer)

            assert.strictEqual(result.command, 'npx')
            assert.deepStrictEqual(result.args, ['-y', '@example/package@1.0.0'])
            assert.strictEqual(result.url, undefined)
        })

        it('should convert pypi server with UV_DEFAULT_INDEX', () => {
            const registryServer: McpRegistryServer = {
                name: 'test-pypi',
                description: 'Test pypi server',
                version: '1.0.2',
                packages: [
                    {
                        registryType: 'pypi',
                        registryBaseUrl: 'https://private-pypi.acme.com',
                        identifier: 'awslabs.ccapi-mcp-server',
                        transport: { type: 'stdio' },
                    },
                ],
            }

            const result = converter.convertRegistryServer(registryServer)

            assert.strictEqual(result.command, 'uvx')
            assert.deepStrictEqual(result.args, ['awslabs.ccapi-mcp-server@1.0.2'])
            assert.strictEqual(result.env!['UV_DEFAULT_INDEX'], 'https://private-pypi.acme.com')
        })

        it('should convert npm server with NPM_CONFIG_REGISTRY', () => {
            const registryServer: McpRegistryServer = {
                name: 'test-npm',
                description: 'Test npm server',
                version: '0.6.2',
                packages: [
                    {
                        registryType: 'npm',
                        registryBaseUrl: 'https://private-npm.acme.com',
                        identifier: '@modelcontextprotocol/everything',
                        transport: { type: 'stdio' },
                    },
                ],
            }

            const result = converter.convertRegistryServer(registryServer)

            assert.strictEqual(result.command, 'npx')
            assert.deepStrictEqual(result.args, ['-y', '@modelcontextprotocol/everything@0.6.2'])
            assert.strictEqual(result.env!['NPM_CONFIG_REGISTRY'], 'https://private-npm.acme.com')
        })

        it('should throw error for invalid server', () => {
            const registryServer: McpRegistryServer = {
                name: 'invalid',
                description: 'Invalid server',
                version: '1.0.0',
            }

            assert.throws(() => converter.convertRegistryServer(registryServer))
        })
    })

    describe('convertRemoteServer', () => {
        it('should convert remote server with headers', () => {
            const registryServer: McpRegistryServer = {
                name: 'test',
                description: 'Test',
                version: '1.0.0',
                remotes: [
                    {
                        type: 'sse',
                        url: 'https://example.com/mcp',
                        headers: [
                            { name: 'Authorization', value: 'Bearer token' },
                            { name: 'X-Custom', value: 'value' },
                        ],
                    },
                ],
            }

            const result = converter.convertRegistryServer(registryServer)

            assert.strictEqual(result.url, 'https://example.com/mcp')
            assert.deepStrictEqual(result.headers, {
                Authorization: 'Bearer token',
                'X-Custom': 'value',
            })
        })

        it('should convert remote server without headers', () => {
            const registryServer: McpRegistryServer = {
                name: 'test',
                description: 'Test',
                version: '1.0.0',
                remotes: [
                    {
                        type: 'streamable-http',
                        url: 'https://example.com/mcp',
                    },
                ],
            }

            const result = converter.convertRegistryServer(registryServer)

            assert.strictEqual(result.url, 'https://example.com/mcp')
            assert.strictEqual(result.headers, undefined)
        })
    })

    describe('convertLocalServer', () => {
        it('should convert package with arguments', () => {
            const registryServer: McpRegistryServer = {
                name: 'test',
                description: 'Test',
                version: '1.0.0',
                packages: [
                    {
                        registryType: 'npm',
                        identifier: '@example/package',
                        transport: { type: 'stdio' },
                        packageArguments: [
                            { type: 'positional', value: '--verbose' },
                            { type: 'positional', value: '--debug' },
                        ],
                    },
                ],
            }

            const result = converter.convertRegistryServer(registryServer)

            assert.strictEqual(result.command, 'npx')
            assert.deepStrictEqual(result.args, ['-y', '@example/package@1.0.0', '--verbose', '--debug'])
        })

        it('should convert package with environment variables', () => {
            const registryServer: McpRegistryServer = {
                name: 'test',
                description: 'Test',
                version: '1.0.0',
                packages: [
                    {
                        registryType: 'npm',
                        identifier: '@example/package',
                        transport: { type: 'stdio' },
                        environmentVariables: [
                            { name: 'API_KEY', default: 'default-key' },
                            { name: 'ENV', default: 'production' },
                        ],
                    },
                ],
            }

            const result = converter.convertRegistryServer(registryServer)

            assert.strictEqual(result.command, 'npx')
            assert.deepStrictEqual(result.args, ['-y', '@example/package@1.0.0'])
            assert.deepStrictEqual(result.env, {
                API_KEY: 'default-key',
                ENV: 'production',
            })
        })

        it('should convert package with both arguments and environment variables', () => {
            const registryServer: McpRegistryServer = {
                name: 'test',
                description: 'Test',
                version: '1.0.0',
                packages: [
                    {
                        registryType: 'npm',
                        identifier: '@example/package',
                        transport: { type: 'stdio' },
                        packageArguments: [{ type: 'positional', value: '--verbose' }],
                        environmentVariables: [{ name: 'DEBUG', default: 'true' }],
                    },
                ],
            }

            const result = converter.convertRegistryServer(registryServer)

            assert.strictEqual(result.command, 'npx')
            assert.deepStrictEqual(result.args, ['-y', '@example/package@1.0.0', '--verbose'])
            assert.deepStrictEqual(result.env, { DEBUG: 'true' })
        })

        it('should convert pypi package with all options', () => {
            const registryServer: McpRegistryServer = {
                name: 'test',
                description: 'Test',
                version: '1.0.2',
                packages: [
                    {
                        registryType: 'pypi',
                        registryBaseUrl: 'https://private-pypi.acme.com',
                        identifier: 'awslabs.ccapi-mcp-server',
                        transport: { type: 'stdio' },
                        packageArguments: [{ type: 'positional', value: '--readonly' }],
                        environmentVariables: [{ name: 'AWS_PROFILE', default: 'profile-16' }],
                    },
                ],
            }

            const result = converter.convertRegistryServer(registryServer)

            assert.strictEqual(result.command, 'uvx')
            assert.deepStrictEqual(result.args, ['awslabs.ccapi-mcp-server@1.0.2', '--readonly'])
            assert.deepStrictEqual(result.env, {
                UV_DEFAULT_INDEX: 'https://private-pypi.acme.com',
                AWS_PROFILE: 'profile-16',
            })
        })
    })
})
