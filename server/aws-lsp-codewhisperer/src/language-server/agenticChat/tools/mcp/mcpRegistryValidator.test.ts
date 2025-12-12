/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { McpRegistryValidator } from './mcpRegistryValidator'
import { McpRegistryData } from './mcpTypes'
import { MCP_REGISTRY_CONSTANTS } from './mcpRegistryConstants'
import * as assert from 'assert'

describe('McpRegistryValidator', () => {
    let validator: McpRegistryValidator

    beforeEach(() => {
        validator = new McpRegistryValidator()
    })

    describe('validateRegistryJson', () => {
        it('should accept valid registry with servers array', () => {
            const registry = {
                servers: [
                    {
                        name: 'mcp-fs',
                        description: 'Test server',
                        version: '1.0.0',
                        remotes: [{ type: 'streamable-http', url: 'https://example.com' }],
                    },
                ],
            }
            const result = validator.validateRegistryJson(registry)
            assert.strictEqual(result.isValid, true)
            assert.strictEqual(result.errors.length, 0)
        })

        it('should accept registry with server wrapper structure', () => {
            const registry = {
                servers: [
                    {
                        server: {
                            name: 'mcp-fs',
                            description: 'Test server',
                            version: '1.0.0',
                            remotes: [{ type: 'streamable-http', url: 'https://example.com' }],
                        },
                    },
                ],
            }
            const result = validator.validateRegistryJson(registry)
            assert.strictEqual(result.isValid, true)
            assert.strictEqual(result.errors.length, 0)
        })

        it('should reject non-object registry', () => {
            const result = validator.validateRegistryJson(null)
            assert.strictEqual(result.isValid, false)
            assert.ok(result.errors.includes('Registry must be an object'))
        })

        it('should reject registry without servers array', () => {
            const result = validator.validateRegistryJson({})
            assert.strictEqual(result.isValid, false)
            assert.ok(result.errors.includes('Registry must have a servers array'))
        })

        it('should validate all servers in array', () => {
            const registry = {
                servers: [
                    {
                        name: 'test1',
                        description: 'Test',
                        version: '1.0.0',
                        remotes: [{ type: 'sse', url: 'https://example.com' }],
                    },
                    { description: 'Missing name', version: '1.0.0' },
                ],
            }
            const result = validator.validateRegistryJson(registry)
            assert.strictEqual(result.isValid, false)
            assert.ok(result.errors.some(e => e.includes('Server 1')))
        })
    })

    describe('validateServerDefinition', () => {
        it('should accept valid remote server', () => {
            const server = {
                name: 'mcp-fs',
                description: 'Test server',
                version: '1.0.0',
                remotes: [{ type: 'streamable-http', url: 'https://example.com' }],
            }
            const result = validator.validateServerDefinition(server)
            assert.strictEqual(result.isValid, true)
        })

        it('should accept valid local server', () => {
            const server = {
                name: 'everything',
                description: 'Test server',
                version: '1.0.0',
                packages: [
                    {
                        registryType: 'npm',
                        identifier: '@example/package',
                        version: '1.0.0',
                        transport: { type: 'stdio' },
                    },
                ],
            }
            const result = validator.validateServerDefinition(server)
            assert.strictEqual(result.isValid, true)
        })

        it('should reject server without name', () => {
            const server = { description: 'Test', version: '1.0.0', remotes: [] }
            const result = validator.validateServerDefinition(server)
            assert.strictEqual(result.isValid, false)
            assert.ok(result.errors.some(e => e.includes('name')))
        })

        it('should reject server without description', () => {
            const server = { name: 'test', version: '1.0.0', remotes: [] }
            const result = validator.validateServerDefinition(server)
            assert.strictEqual(result.isValid, false)
            assert.ok(result.errors.some(e => e.includes('description')))
        })

        it('should reject server without version', () => {
            const server = { name: 'test', description: 'Test', remotes: [] }
            const result = validator.validateServerDefinition(server)
            assert.strictEqual(result.isValid, false)
            assert.ok(result.errors.some(e => e.includes('version')))
        })

        it('should reject server without remotes or packages', () => {
            const server = { name: 'test', description: 'Test', version: '1.0.0' }
            const result = validator.validateServerDefinition(server)
            assert.strictEqual(result.isValid, false)
            assert.ok(result.errors.some(e => e.includes('remotes or packages')))
        })

        it('should reject server with both remotes and packages', () => {
            const server = {
                name: 'test',
                description: 'Test',
                version: '1.0.0',
                remotes: [{ type: 'sse', url: 'https://example.com' }],
                packages: [{ registryType: 'npm', identifier: 'pkg', version: '1.0.0', transport: { type: 'stdio' } }],
            }
            const result = validator.validateServerDefinition(server)
            assert.strictEqual(result.isValid, false)
            assert.ok(result.errors.some(e => e.includes('cannot have both')))
        })
    })

    describe('validateServerName', () => {
        it('should accept simple identifier names', () => {
            assert.strictEqual(validator.validateServerName('mcp-fs').isValid, true)
            assert.strictEqual(validator.validateServerName('everything').isValid, true)
            assert.strictEqual(validator.validateServerName('server-name').isValid, true)
        })

        it('should accept names with dots, underscores, and hyphens', () => {
            assert.strictEqual(validator.validateServerName('server.name').isValid, true)
            assert.strictEqual(validator.validateServerName('server_name').isValid, true)
            assert.strictEqual(validator.validateServerName('server-name').isValid, true)
            assert.strictEqual(validator.validateServerName('server.name_test-123').isValid, true)
        })

        it('should reject names with slashes', () => {
            const result1 = validator.validateServerName('com.example/test')
            assert.strictEqual(result1.isValid, false)
            assert.ok(result1.errors.some(e => e.includes('simple identifier')))

            const result2 = validator.validateServerName('org.acme/my-server')
            assert.strictEqual(result2.isValid, false)
            assert.ok(result2.errors.some(e => e.includes('simple identifier')))
        })

        it('should reject names with special characters', () => {
            const result1 = validator.validateServerName('server@name')
            assert.strictEqual(result1.isValid, false)
            assert.ok(result1.errors.some(e => e.includes('simple identifier')))

            const result2 = validator.validateServerName('server name')
            assert.strictEqual(result2.isValid, false)
            assert.ok(result2.errors.some(e => e.includes('simple identifier')))
        })

        it('should accept names up to 200 characters', () => {
            const name = 'a'.repeat(MCP_REGISTRY_CONSTANTS.MAX_SERVER_NAME_LENGTH)
            assert.strictEqual(validator.validateServerName(name).isValid, true)
        })

        it('should reject names over 200 characters', () => {
            const name = 'a'.repeat(MCP_REGISTRY_CONSTANTS.MAX_SERVER_NAME_LENGTH + 1)
            const result = validator.validateServerName(name)
            assert.strictEqual(result.isValid, false)
            assert.ok(result.errors.some(e => e.includes('3-200 characters')))
        })

        it('should reject empty names', () => {
            const result = validator.validateServerName('')
            assert.strictEqual(result.isValid, false)
            assert.ok(result.errors.some(e => e.includes('cannot be empty')))
        })

        it('should reject names shorter than 3 characters', () => {
            const result1 = validator.validateServerName('ab')
            assert.strictEqual(result1.isValid, false)
            assert.ok(result1.errors.some(e => e.includes('3-200 characters')))

            const result2 = validator.validateServerName('a')
            assert.strictEqual(result2.isValid, false)
            assert.ok(result2.errors.some(e => e.includes('3-200 characters')))
        })

        it('should accept names with exactly 3 characters', () => {
            const result = validator.validateServerName('abc')
            assert.strictEqual(result.isValid, true)
        })
    })

    describe('validateServerNameUniqueness', () => {
        it('should accept registry with unique server names', () => {
            const servers = [
                { name: 'mcp-fs', description: 'Test 1', version: '1.0.0' },
                { name: 'everything', description: 'Test 2', version: '1.0.0' },
                { name: 'server-three', description: 'Test 3', version: '1.0.0' },
            ]
            const result = validator.validateServerNameUniqueness(servers)
            assert.strictEqual(result.isValid, true)
            assert.strictEqual(result.errors.length, 0)
        })

        it('should reject registry with duplicate server names', () => {
            const servers = [
                { name: 'mcp-fs', description: 'Test 1', version: '1.0.0' },
                { name: 'everything', description: 'Test 2', version: '1.0.0' },
                { name: 'mcp-fs', description: 'Duplicate', version: '2.0.0' },
            ]
            const result = validator.validateServerNameUniqueness(servers)
            assert.strictEqual(result.isValid, false)
            assert.ok(result.errors.some(e => e.includes("Duplicate server name 'mcp-fs'")))
        })

        it('should detect multiple duplicates', () => {
            const servers = [
                { name: 'server-a', description: 'Test 1', version: '1.0.0' },
                { name: 'server-b', description: 'Test 2', version: '1.0.0' },
                { name: 'server-a', description: 'Duplicate A', version: '2.0.0' },
                { name: 'server-b', description: 'Duplicate B', version: '2.0.0' },
            ]
            const result = validator.validateServerNameUniqueness(servers)
            assert.strictEqual(result.isValid, false)
            assert.ok(result.errors.some(e => e.includes("Duplicate server name 'server-a'")))
            assert.ok(result.errors.some(e => e.includes("Duplicate server name 'server-b'")))
        })

        it('should handle empty servers array', () => {
            const result = validator.validateServerNameUniqueness([])
            assert.strictEqual(result.isValid, true)
            assert.strictEqual(result.errors.length, 0)
        })

        it('should handle servers without name field', () => {
            const servers = [
                { name: 'valid-server', description: 'Test', version: '1.0.0' },
                { description: 'No name', version: '1.0.0' },
            ]
            const result = validator.validateServerNameUniqueness(servers)
            assert.strictEqual(result.isValid, true)
        })
    })

    describe('validateRemoteServer', () => {
        it('should accept valid streamable-http remote', () => {
            const remotes = [{ type: 'streamable-http', url: 'https://example.com' }]
            const result = validator.validateRemoteServer(remotes)
            assert.strictEqual(result.isValid, true)
        })

        it('should accept valid sse remote', () => {
            const remotes = [{ type: 'sse', url: 'https://example.com' }]
            const result = validator.validateRemoteServer(remotes)
            assert.strictEqual(result.isValid, true)
        })

        it('should accept optional headers', () => {
            const remotes = [
                {
                    type: 'streamable-http',
                    url: 'https://example.com',
                    headers: [
                        { name: 'Authorization', value: 'Bearer token' },
                        { name: 'X-Custom', value: 'value' },
                    ],
                },
            ]
            const result = validator.validateRemoteServer(remotes)
            assert.strictEqual(result.isValid, true)
        })

        it('should reject multiple remotes entries', () => {
            const remotes = [
                { type: 'sse', url: 'https://example1.com' },
                { type: 'sse', url: 'https://example2.com' },
            ]
            const result = validator.validateRemoteServer(remotes)
            assert.strictEqual(result.isValid, false)
            assert.ok(result.errors.some(e => e.includes('exactly one')))
        })

        it('should reject invalid transport type', () => {
            const remotes = [{ type: 'invalid', url: 'https://example.com' }]
            const result = validator.validateRemoteServer(remotes)
            assert.strictEqual(result.isValid, false)
            assert.ok(result.errors.some(e => e.includes('streamable-http or sse')))
        })

        it('should reject missing url', () => {
            const remotes = [{ type: 'sse' }]
            const result = validator.validateRemoteServer(remotes)
            assert.strictEqual(result.isValid, false)
            assert.ok(result.errors.some(e => e.includes('url')))
        })

        it('should reject invalid headers format', () => {
            const remotes = [{ type: 'sse', url: 'https://example.com', headers: [{ name: 'Test' }] }]
            const result = validator.validateRemoteServer(remotes)
            assert.strictEqual(result.isValid, false)
            assert.ok(result.errors.some(e => e.includes('value')))
        })
    })

    describe('validateLocalServer', () => {
        it('should accept valid npm package', () => {
            const packages = [
                {
                    registryType: 'npm',
                    identifier: '@example/package',
                    transport: { type: 'stdio' },
                },
            ]
            const result = validator.validateLocalServer(packages)
            assert.strictEqual(result.isValid, true)
        })

        it('should accept valid pypi package', () => {
            const packages = [
                {
                    registryType: 'pypi',
                    identifier: 'example-package',
                    transport: { type: 'stdio' },
                },
            ]
            const result = validator.validateLocalServer(packages)
            assert.strictEqual(result.isValid, true)
        })

        it('should accept optional packageArguments', () => {
            const packages = [
                {
                    registryType: 'npm',
                    identifier: 'pkg',
                    transport: { type: 'stdio' },
                    packageArguments: [{ value: 'arg1' }, { value: 'arg2' }],
                },
            ]
            const result = validator.validateLocalServer(packages)
            assert.strictEqual(result.isValid, true)
        })

        it('should accept optional environmentVariables', () => {
            const packages = [
                {
                    registryType: 'npm',
                    identifier: 'pkg',
                    transport: { type: 'stdio' },
                    environmentVariables: [
                        { name: 'API_KEY', value: 'default-key' },
                        { name: 'ENV', value: 'production' },
                    ],
                },
            ]
            const result = validator.validateLocalServer(packages)
            assert.strictEqual(result.isValid, true)
        })

        it('should reject multiple packages entries', () => {
            const packages = [
                { registryType: 'npm', identifier: 'pkg1', transport: { type: 'stdio' } },
                { registryType: 'npm', identifier: 'pkg2', transport: { type: 'stdio' } },
            ]
            const result = validator.validateLocalServer(packages)
            assert.strictEqual(result.isValid, false)
            assert.ok(result.errors.some(e => e.includes('exactly one')))
        })

        it('should reject invalid registryType', () => {
            const packages = [{ registryType: 'invalid', identifier: 'pkg', transport: { type: 'stdio' } }]
            const result = validator.validateLocalServer(packages)
            assert.strictEqual(result.isValid, false)
            assert.ok(result.errors.some(e => e.includes('npm, pypi, or oci')))
        })

        it('should accept oci registryType', () => {
            const packages = [
                {
                    registryType: 'oci',
                    identifier: 'mcp/filesystem',
                    transport: { type: 'stdio' },
                },
            ]
            const result = validator.validateLocalServer(packages)
            assert.strictEqual(result.isValid, true)
        })

        it('should accept non-stdio transport types', () => {
            const packages = [{ registryType: 'npm', identifier: 'pkg', transport: { type: 'streamable-http' } }]
            const result = validator.validateLocalServer(packages)
            assert.strictEqual(result.isValid, true)
        })

        it('should accept packageArguments with only value field', () => {
            const packages = [
                {
                    registryType: 'npm',
                    identifier: 'pkg',
                    transport: { type: 'stdio' },
                    packageArguments: [{ value: 'arg' }],
                },
            ]
            const result = validator.validateLocalServer(packages)
            assert.strictEqual(result.isValid, true)
        })

        it('should accept runtimeArguments', () => {
            const packages = [
                {
                    registryType: 'npm',
                    identifier: 'pkg',
                    transport: { type: 'stdio' },
                    runtimeArguments: [{ value: '--silent' }],
                },
            ]
            const result = validator.validateLocalServer(packages)
            assert.strictEqual(result.isValid, true)
        })

        it('should accept environmentVariables with only name field', () => {
            const packages = [
                {
                    registryType: 'npm',
                    identifier: 'pkg',
                    transport: { type: 'stdio' },
                    environmentVariables: [{ name: 'VAR' }],
                },
            ]
            const result = validator.validateLocalServer(packages)
            assert.strictEqual(result.isValid, true)
        })
    })

    describe('registry validation with uniqueness check', () => {
        it('should reject registry with duplicate server names', () => {
            const registry = {
                servers: [
                    {
                        name: 'mcp-fs',
                        description: 'First',
                        version: '1.0.0',
                        remotes: [{ type: 'sse', url: 'https://example.com' }],
                    },
                    {
                        name: 'everything',
                        description: 'Second',
                        version: '1.0.0',
                        packages: [{ registryType: 'npm', identifier: 'pkg', transport: { type: 'stdio' } }],
                    },
                    {
                        name: 'mcp-fs',
                        description: 'Duplicate',
                        version: '2.0.0',
                        remotes: [{ type: 'sse', url: 'https://other.com' }],
                    },
                ],
            }
            const result = validator.validateRegistryJson(registry)
            assert.strictEqual(result.isValid, false)
            assert.ok(result.errors.some(e => e.includes("Duplicate server name 'mcp-fs'")))
        })
    })

    describe('validateTimeout', () => {
        it('should accept valid timeout values', () => {
            const result = validator.validateTimeout(5000)
            assert.strictEqual(result.isValid, true)
            assert.strictEqual(result.errors.length, 0)
        })

        it('should accept any positive integer', () => {
            assert.strictEqual(validator.validateTimeout(1).isValid, true)
            assert.strictEqual(validator.validateTimeout(1000).isValid, true)
            assert.strictEqual(validator.validateTimeout(60000).isValid, true)
            assert.strictEqual(validator.validateTimeout(300000).isValid, true)
        })

        it('should accept undefined timeout', () => {
            const result = validator.validateTimeout(undefined)
            assert.strictEqual(result.isValid, true)
            assert.strictEqual(result.errors.length, 0)
        })

        it('should reject non-integer timeout', () => {
            const result = validator.validateTimeout(5000.5)
            assert.strictEqual(result.isValid, false)
            assert.strictEqual(result.errors.length, 1)
            assert.ok(result.errors[0].includes('positive integer'))
        })

        it('should reject string timeout', () => {
            const result = validator.validateTimeout('5000' as any)
            assert.strictEqual(result.isValid, false)
            assert.strictEqual(result.errors.length, 1)
            assert.ok(result.errors[0].includes('positive integer'))
        })

        it('should reject negative timeout', () => {
            const result = validator.validateTimeout(-5000)
            assert.strictEqual(result.isValid, false)
            assert.strictEqual(result.errors.length, 1)
            assert.ok(result.errors[0].includes('positive integer'))
        })

        it('should reject zero timeout', () => {
            const result = validator.validateTimeout(0)
            assert.strictEqual(result.isValid, false)
            assert.strictEqual(result.errors.length, 1)
            assert.ok(result.errors[0].includes('positive integer'))
        })
    })
})
