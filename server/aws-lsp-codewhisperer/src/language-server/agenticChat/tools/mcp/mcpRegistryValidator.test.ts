/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { McpRegistryValidator, AgentConfigValidator } from './mcpRegistryValidator'
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
                        name: 'com.example/test',
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
                name: 'com.example/test',
                description: 'Test server',
                version: '1.0.0',
                remotes: [{ type: 'streamable-http', url: 'https://example.com' }],
            }
            const result = validator.validateServerDefinition(server)
            assert.strictEqual(result.isValid, true)
        })

        it('should accept valid local server', () => {
            const server = {
                name: 'com.example/test',
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
        it('should accept valid reverse-DNS format names', () => {
            assert.strictEqual(validator.validateServerName('com.example/test').isValid, true)
            assert.strictEqual(validator.validateServerName('org.acme/my-server').isValid, true)
        })

        it('should accept names up to 255 characters', () => {
            const name = 'a'.repeat(MCP_REGISTRY_CONSTANTS.MAX_SERVER_NAME_LENGTH)
            assert.strictEqual(validator.validateServerName(name).isValid, true)
        })

        it('should reject names over 255 characters', () => {
            const name = 'a'.repeat(MCP_REGISTRY_CONSTANTS.MAX_SERVER_NAME_LENGTH + 1)
            const result = validator.validateServerName(name)
            assert.strictEqual(result.isValid, false)
        })

        it('should reject empty names', () => {
            const result = validator.validateServerName('')
            assert.strictEqual(result.isValid, false)
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
                    version: '1.0.0',
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
                    version: '1.0.0',
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
                    version: '1.0.0',
                    transport: { type: 'stdio' },
                    packageArguments: [
                        { type: 'positional', value: 'arg1' },
                        { type: 'positional', value: 'arg2' },
                    ],
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
                    version: '1.0.0',
                    transport: { type: 'stdio' },
                    environmentVariables: [
                        { name: 'API_KEY', default: 'default-key' },
                        { name: 'ENV', default: 'production' },
                    ],
                },
            ]
            const result = validator.validateLocalServer(packages)
            assert.strictEqual(result.isValid, true)
        })

        it('should reject multiple packages entries', () => {
            const packages = [
                { registryType: 'npm', identifier: 'pkg1', version: '1.0.0', transport: { type: 'stdio' } },
                { registryType: 'npm', identifier: 'pkg2', version: '1.0.0', transport: { type: 'stdio' } },
            ]
            const result = validator.validateLocalServer(packages)
            assert.strictEqual(result.isValid, false)
            assert.ok(result.errors.some(e => e.includes('exactly one')))
        })

        it('should reject invalid registryType', () => {
            const packages = [
                { registryType: 'invalid', identifier: 'pkg', version: '1.0.0', transport: { type: 'stdio' } },
            ]
            const result = validator.validateLocalServer(packages)
            assert.strictEqual(result.isValid, false)
            assert.ok(result.errors.some(e => e.includes('npm or pypi')))
        })

        it('should reject non-stdio transport', () => {
            const packages = [{ registryType: 'npm', identifier: 'pkg', version: '1.0.0', transport: { type: 'http' } }]
            const result = validator.validateLocalServer(packages)
            assert.strictEqual(result.isValid, false)
            assert.ok(result.errors.some(e => e.includes('stdio')))
        })

        it('should reject invalid packageArguments', () => {
            const packages = [
                {
                    registryType: 'npm',
                    identifier: 'pkg',
                    version: '1.0.0',
                    transport: { type: 'stdio' },
                    packageArguments: [{ type: 'named', value: 'arg' }],
                },
            ]
            const result = validator.validateLocalServer(packages)
            assert.strictEqual(result.isValid, false)
            assert.ok(result.errors.some(e => e.includes('positional')))
        })

        it('should reject invalid environmentVariables', () => {
            const packages = [
                {
                    registryType: 'npm',
                    identifier: 'pkg',
                    version: '1.0.0',
                    transport: { type: 'stdio' },
                    environmentVariables: [{ name: 'VAR' }],
                },
            ]
            const result = validator.validateLocalServer(packages)
            assert.strictEqual(result.isValid, false)
            assert.ok(result.errors.some(e => e.includes('default')))
        })
    })

    describe('isServerInRegistry', () => {
        it('should return true for server in registry', () => {
            const registry: McpRegistryData = {
                servers: [
                    {
                        name: 'com.example/test',
                        description: 'Test',
                        version: '1.0.0',
                        remotes: [{ type: 'sse', url: 'https://example.com' }],
                    },
                ],
                lastFetched: new Date(),
                url: 'https://example.com/registry.json',
            }
            assert.strictEqual(validator.isServerInRegistry('com.example/test', registry), true)
        })

        it('should return false for server not in registry', () => {
            const registry: McpRegistryData = {
                servers: [
                    {
                        name: 'com.example/test',
                        description: 'Test',
                        version: '1.0.0',
                        remotes: [{ type: 'sse', url: 'https://example.com' }],
                    },
                ],
                lastFetched: new Date(),
                url: 'https://example.com/registry.json',
            }
            assert.strictEqual(validator.isServerInRegistry('com.other/server', registry), false)
        })

        it('should return false for empty registry', () => {
            const registry: McpRegistryData = {
                servers: [],
                lastFetched: new Date(),
                url: 'https://example.com/registry.json',
            }
            assert.strictEqual(validator.isServerInRegistry('com.example/test', registry), false)
        })
    })
})

describe('AgentConfigValidator', () => {
    let validator: AgentConfigValidator

    beforeEach(() => {
        validator = new AgentConfigValidator()
    })

    describe('validateMcpServersField', () => {
        it('should accept valid mcpServers with registry servers', () => {
            const mcpServers = {
                'com.example/test': { type: 'registry', enabled: true },
                'com.example/test2': { type: 'registry', enabled: false },
            }
            const result = validator.validateMcpServersField(mcpServers, ['com.example/test', 'com.example/test2'])
            assert.strictEqual(result.isValid, true)
            assert.strictEqual(result.errors.length, 0)
        })

        it('should reject non-object mcpServers', () => {
            const result = validator.validateMcpServersField(null, [])
            assert.strictEqual(result.isValid, false)
            assert.ok(result.errors.includes('mcpServers must be an object'))
        })

        it('should warn for registry server not in available servers', () => {
            const mcpServers = {
                'com.example/unknown': { type: 'registry', enabled: true },
            }
            const result = validator.validateMcpServersField(mcpServers, ['com.example/test'])
            assert.ok(result.warnings.some(w => w.includes('not found')))
        })

        it('should warn for registry server with command/url fields', () => {
            const mcpServers = {
                'com.example/test': { type: 'registry', enabled: true, command: 'node' },
            }
            const result = validator.validateMcpServersField(mcpServers, ['com.example/test'])
            assert.ok(result.warnings.some(w => w.includes('should not have')))
        })
    })

    describe('validateServerConfig', () => {
        it('should accept valid registry server config', () => {
            const config = { type: 'registry', enabled: true }
            const result = validator.validateServerConfig('com.example/test', config, ['com.example/test'])
            assert.strictEqual(result.isValid, true)
        })

        it('should warn for missing enabled field', () => {
            const config = { type: 'registry' }
            const result = validator.validateServerConfig('com.example/test', config, ['com.example/test'])
            assert.ok(result.warnings.some(w => w.includes('missing enabled')))
        })

        it('should reject non-object config', () => {
            const result = validator.validateServerConfig('test', null, [])
            assert.strictEqual(result.isValid, false)
            assert.ok(result.errors.some(e => e.includes('must be an object')))
        })
    })

    describe('validateServerName', () => {
        it('should return true for server in available list', () => {
            assert.strictEqual(validator.validateServerName('com.example/test', ['com.example/test']), true)
        })

        it('should return false for server not in available list', () => {
            assert.strictEqual(validator.validateServerName('com.example/unknown', ['com.example/test']), false)
        })
    })
})
