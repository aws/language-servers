/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { McpRegistryValidator, AgentConfigValidator } from './mcpRegistryValidator'
import { McpRegistryData } from './mcpRegistryService'

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
            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)
        })

        it('should reject non-object registry', () => {
            const result = validator.validateRegistryJson(null)
            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('Registry must be an object')
        })

        it('should reject registry without servers array', () => {
            const result = validator.validateRegistryJson({})
            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('Registry must have a servers array')
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
            expect(result.isValid).toBe(false)
            expect(result.errors.some(e => e.includes('Server 1'))).toBe(true)
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
            expect(result.isValid).toBe(true)
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
            expect(result.isValid).toBe(true)
        })

        it('should reject server without name', () => {
            const server = { description: 'Test', version: '1.0.0', remotes: [] }
            const result = validator.validateServerDefinition(server)
            expect(result.isValid).toBe(false)
            expect(result.errors.some(e => e.includes('name'))).toBe(true)
        })

        it('should reject server without description', () => {
            const server = { name: 'test', version: '1.0.0', remotes: [] }
            const result = validator.validateServerDefinition(server)
            expect(result.isValid).toBe(false)
            expect(result.errors.some(e => e.includes('description'))).toBe(true)
        })

        it('should reject server without version', () => {
            const server = { name: 'test', description: 'Test', remotes: [] }
            const result = validator.validateServerDefinition(server)
            expect(result.isValid).toBe(false)
            expect(result.errors.some(e => e.includes('version'))).toBe(true)
        })

        it('should reject server without remotes or packages', () => {
            const server = { name: 'test', description: 'Test', version: '1.0.0' }
            const result = validator.validateServerDefinition(server)
            expect(result.isValid).toBe(false)
            expect(result.errors.some(e => e.includes('remotes or packages'))).toBe(true)
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
            expect(result.isValid).toBe(false)
            expect(result.errors.some(e => e.includes('cannot have both'))).toBe(true)
        })
    })

    describe('validateServerName', () => {
        it('should accept valid reverse-DNS format names', () => {
            expect(validator.validateServerName('com.example/test').isValid).toBe(true)
            expect(validator.validateServerName('org.acme/my-server').isValid).toBe(true)
        })

        it('should accept names up to 255 characters', () => {
            const name = 'a'.repeat(255)
            expect(validator.validateServerName(name).isValid).toBe(true)
        })

        it('should reject names over 255 characters', () => {
            const name = 'a'.repeat(256)
            const result = validator.validateServerName(name)
            expect(result.isValid).toBe(false)
        })

        it('should reject empty names', () => {
            const result = validator.validateServerName('')
            expect(result.isValid).toBe(false)
        })
    })

    describe('validateRemoteServer', () => {
        it('should accept valid streamable-http remote', () => {
            const remotes = [{ type: 'streamable-http', url: 'https://example.com' }]
            const result = validator.validateRemoteServer(remotes)
            expect(result.isValid).toBe(true)
        })

        it('should accept valid sse remote', () => {
            const remotes = [{ type: 'sse', url: 'https://example.com' }]
            const result = validator.validateRemoteServer(remotes)
            expect(result.isValid).toBe(true)
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
            expect(result.isValid).toBe(true)
        })

        it('should reject multiple remotes entries', () => {
            const remotes = [
                { type: 'sse', url: 'https://example1.com' },
                { type: 'sse', url: 'https://example2.com' },
            ]
            const result = validator.validateRemoteServer(remotes)
            expect(result.isValid).toBe(false)
            expect(result.errors.some(e => e.includes('exactly one'))).toBe(true)
        })

        it('should reject invalid transport type', () => {
            const remotes = [{ type: 'invalid', url: 'https://example.com' }]
            const result = validator.validateRemoteServer(remotes)
            expect(result.isValid).toBe(false)
            expect(result.errors.some(e => e.includes('streamable-http or sse'))).toBe(true)
        })

        it('should reject missing url', () => {
            const remotes = [{ type: 'sse' }]
            const result = validator.validateRemoteServer(remotes)
            expect(result.isValid).toBe(false)
            expect(result.errors.some(e => e.includes('url'))).toBe(true)
        })

        it('should reject invalid headers format', () => {
            const remotes = [{ type: 'sse', url: 'https://example.com', headers: [{ name: 'Test' }] }]
            const result = validator.validateRemoteServer(remotes)
            expect(result.isValid).toBe(false)
            expect(result.errors.some(e => e.includes('value'))).toBe(true)
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
            expect(result.isValid).toBe(true)
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
            expect(result.isValid).toBe(true)
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
            expect(result.isValid).toBe(true)
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
            expect(result.isValid).toBe(true)
        })

        it('should reject multiple packages entries', () => {
            const packages = [
                { registryType: 'npm', identifier: 'pkg1', version: '1.0.0', transport: { type: 'stdio' } },
                { registryType: 'npm', identifier: 'pkg2', version: '1.0.0', transport: { type: 'stdio' } },
            ]
            const result = validator.validateLocalServer(packages)
            expect(result.isValid).toBe(false)
            expect(result.errors.some(e => e.includes('exactly one'))).toBe(true)
        })

        it('should reject invalid registryType', () => {
            const packages = [
                { registryType: 'invalid', identifier: 'pkg', version: '1.0.0', transport: { type: 'stdio' } },
            ]
            const result = validator.validateLocalServer(packages)
            expect(result.isValid).toBe(false)
            expect(result.errors.some(e => e.includes('npm or pypi'))).toBe(true)
        })

        it('should reject non-stdio transport', () => {
            const packages = [{ registryType: 'npm', identifier: 'pkg', version: '1.0.0', transport: { type: 'http' } }]
            const result = validator.validateLocalServer(packages)
            expect(result.isValid).toBe(false)
            expect(result.errors.some(e => e.includes('stdio'))).toBe(true)
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
            expect(result.isValid).toBe(false)
            expect(result.errors.some(e => e.includes('positional'))).toBe(true)
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
            expect(result.isValid).toBe(false)
            expect(result.errors.some(e => e.includes('default'))).toBe(true)
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
            expect(validator.isServerInRegistry('com.example/test', registry)).toBe(true)
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
            expect(validator.isServerInRegistry('com.other/server', registry)).toBe(false)
        })

        it('should return false for empty registry', () => {
            const registry: McpRegistryData = {
                servers: [],
                lastFetched: new Date(),
                url: 'https://example.com/registry.json',
            }
            expect(validator.isServerInRegistry('com.example/test', registry)).toBe(false)
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
            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)
        })

        it('should reject non-object mcpServers', () => {
            const result = validator.validateMcpServersField(null, [])
            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('mcpServers must be an object')
        })

        it('should warn for registry server not in available servers', () => {
            const mcpServers = {
                'com.example/unknown': { type: 'registry', enabled: true },
            }
            const result = validator.validateMcpServersField(mcpServers, ['com.example/test'])
            expect(result.warnings.some(w => w.includes('not found'))).toBe(true)
        })

        it('should warn for registry server with command/url fields', () => {
            const mcpServers = {
                'com.example/test': { type: 'registry', enabled: true, command: 'node' },
            }
            const result = validator.validateMcpServersField(mcpServers, ['com.example/test'])
            expect(result.warnings.some(w => w.includes('should not have'))).toBe(true)
        })
    })

    describe('validateServerConfig', () => {
        it('should accept valid registry server config', () => {
            const config = { type: 'registry', enabled: true }
            const result = validator.validateServerConfig('com.example/test', config, ['com.example/test'])
            expect(result.isValid).toBe(true)
        })

        it('should warn for missing enabled field', () => {
            const config = { type: 'registry' }
            const result = validator.validateServerConfig('com.example/test', config, ['com.example/test'])
            expect(result.warnings.some(w => w.includes('missing enabled'))).toBe(true)
        })

        it('should reject non-object config', () => {
            const result = validator.validateServerConfig('test', null, [])
            expect(result.isValid).toBe(false)
            expect(result.errors.some(e => e.includes('must be an object'))).toBe(true)
        })
    })

    describe('validateServerName', () => {
        it('should return true for server in available list', () => {
            expect(validator.validateServerName('com.example/test', ['com.example/test'])).toBe(true)
        })

        it('should return false for server not in available list', () => {
            expect(validator.validateServerName('com.example/unknown', ['com.example/test'])).toBe(false)
        })
    })
})
