/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { McpRegistryData } from './mcpTypes'
import { MCP_REGISTRY_CONSTANTS } from './mcpRegistryConstants'

export interface ValidationResult {
    isValid: boolean
    errors: string[]
}

export class McpRegistryValidator {
    validateRegistryJson(json: any): ValidationResult {
        const errors: string[] = []

        if (!json || typeof json !== 'object') {
            errors.push('Registry must be an object')
            return { isValid: false, errors }
        }

        if (!Array.isArray(json.servers)) {
            errors.push('Registry must have a servers array')
            return { isValid: false, errors }
        }

        // Validate server name uniqueness
        const uniquenessResult = this.validateServerNameUniqueness(json.servers)
        errors.push(...uniquenessResult.errors)

        json.servers.forEach((server: any, index: number) => {
            const serverErrors = this.validateServerDefinition(server).errors
            serverErrors.forEach(err => errors.push(`Server ${index}: ${err}`))
        })

        return { isValid: errors.length === 0, errors }
    }

    validateServerDefinition(server: any): ValidationResult {
        const errors: string[] = []

        if (!server || typeof server !== 'object') {
            errors.push('Server must be an object')
            return { isValid: false, errors }
        }

        if (!server.name || typeof server.name !== 'string') {
            errors.push('Server must have a name field')
        } else if (!this.validateServerName(server.name).isValid) {
            errors.push(`Invalid server name format: ${server.name}`)
        }

        if (!server.description || typeof server.description !== 'string') {
            errors.push('Server must have a description field')
        }

        if (!server.version || typeof server.version !== 'string') {
            errors.push('Server must have a version field')
        }

        const hasRemotes = server.remotes && Array.isArray(server.remotes)
        const hasPackages = server.packages && Array.isArray(server.packages)

        if (!hasRemotes && !hasPackages) {
            errors.push('Server must have either remotes or packages array')
        } else if (hasRemotes && hasPackages) {
            errors.push('Server cannot have both remotes and packages')
        } else if (hasRemotes) {
            const remoteErrors = this.validateRemoteServer(server.remotes).errors
            remoteErrors.forEach(err => errors.push(err))
        } else if (hasPackages) {
            const packageErrors = this.validateLocalServer(server.packages).errors
            packageErrors.forEach(err => errors.push(err))
        }

        return { isValid: errors.length === 0, errors }
    }

    validateServerName(name: string): ValidationResult {
        const errors: string[] = []

        if (!name || name.length === 0) {
            errors.push('Server name cannot be empty')
        } else if (name.length > MCP_REGISTRY_CONSTANTS.MAX_SERVER_NAME_LENGTH) {
            errors.push('Server name must be 1-255 characters')
        }

        return { isValid: errors.length === 0, errors }
    }

    validateServerNameUniqueness(servers: any[]): ValidationResult {
        const errors: string[] = []
        const nameSet = new Set<string>()

        servers.forEach((server, index) => {
            if (server && server.name) {
                if (nameSet.has(server.name)) {
                    errors.push(`Duplicate server name '${server.name}' at index ${index}`)
                } else {
                    nameSet.add(server.name)
                }
            }
        })

        return { isValid: errors.length === 0, errors }
    }

    validateTimeout(timeout: any): ValidationResult {
        const errors: string[] = []

        if (timeout !== undefined) {
            if (typeof timeout !== 'number' || !Number.isInteger(timeout) || timeout <= 0) {
                errors.push('Timeout must be a positive integer')
            }
        }

        return { isValid: errors.length === 0, errors }
    }

    validateRemoteServer(remotes: any[]): ValidationResult {
        const errors: string[] = []

        if (remotes.length !== 1) {
            errors.push('Remote server must have exactly one remotes entry')
            return { isValid: false, errors }
        }

        const remote = remotes[0]
        const validTypes = [
            MCP_REGISTRY_CONSTANTS.TRANSPORT_TYPES.STREAMABLE_HTTP,
            MCP_REGISTRY_CONSTANTS.TRANSPORT_TYPES.SSE,
        ]
        if (!remote.type || !validTypes.includes(remote.type)) {
            errors.push('Remote type must be streamable-http or sse')
        }

        if (!remote.url || typeof remote.url !== 'string') {
            errors.push('Remote must have a url field')
        }

        if (remote.headers) {
            if (!Array.isArray(remote.headers)) {
                errors.push('Remote headers must be an array')
            } else {
                remote.headers.forEach((header: any, index: number) => {
                    if (!header.name || typeof header.name !== 'string') {
                        errors.push(`Header ${index} must have a name field`)
                    }
                    if (!header.value || typeof header.value !== 'string') {
                        errors.push(`Header ${index} must have a value field`)
                    }
                })
            }
        }

        return { isValid: errors.length === 0, errors }
    }

    validateLocalServer(packages: any[]): ValidationResult {
        const errors: string[] = []

        if (packages.length !== 1) {
            errors.push('Local server must have exactly one packages entry')
            return { isValid: false, errors }
        }

        const pkg = packages[0]
        const validRegistryTypes = [
            MCP_REGISTRY_CONSTANTS.REGISTRY_TYPES.NPM,
            MCP_REGISTRY_CONSTANTS.REGISTRY_TYPES.PYPI,
        ]
        if (!pkg.registryType || !validRegistryTypes.includes(pkg.registryType)) {
            errors.push('Package registryType must be npm or pypi')
        }

        if (!pkg.identifier || typeof pkg.identifier !== 'string') {
            errors.push('Package must have an identifier field')
        }

        if (!pkg.version || typeof pkg.version !== 'string') {
            errors.push('Package must have a version field')
        }

        if (!pkg.transport || pkg.transport.type !== MCP_REGISTRY_CONSTANTS.TRANSPORT_TYPES.STDIO) {
            errors.push('Package transport type must be stdio')
        }

        if (pkg.packageArguments) {
            if (!Array.isArray(pkg.packageArguments)) {
                errors.push('Package packageArguments must be an array')
            } else {
                pkg.packageArguments.forEach((arg: any, index: number) => {
                    if (arg.type !== MCP_REGISTRY_CONSTANTS.PACKAGE_ARGUMENT_TYPE.POSITIONAL) {
                        errors.push(`PackageArgument ${index} type must be positional`)
                    }
                    if (!arg.value || typeof arg.value !== 'string') {
                        errors.push(`PackageArgument ${index} must have a value field`)
                    }
                })
            }
        }

        if (pkg.environmentVariables) {
            if (!Array.isArray(pkg.environmentVariables)) {
                errors.push('Package environmentVariables must be an array')
            } else {
                pkg.environmentVariables.forEach((envVar: any, index: number) => {
                    if (!envVar.name || typeof envVar.name !== 'string') {
                        errors.push(`EnvironmentVariable ${index} must have a name field`)
                    }
                    if (!envVar.default || typeof envVar.default !== 'string') {
                        errors.push(`EnvironmentVariable ${index} must have a default field`)
                    }
                })
            }
        }

        return { isValid: errors.length === 0, errors }
    }

    isServerInRegistry(serverName: string, registry: McpRegistryData): boolean {
        return registry.servers.some(s => s.name === serverName)
    }
}
