/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { MCPServerConfig, McpRegistryServer } from './mcpTypes'
import { MCP_REGISTRY_CONSTANTS } from './mcpRegistryConstants'

export class McpServerConfigConverter {
    convertRegistryServer(registryServer: McpRegistryServer): MCPServerConfig {
        if (registryServer.remotes) {
            return this.convertRemoteServer(registryServer.remotes)
        } else if (registryServer.packages) {
            return this.convertLocalServer(registryServer.packages, registryServer.version)
        }
        throw new Error(`Invalid registry server: must have remotes or packages`)
    }

    private convertRemoteServer(remotes: McpRegistryServer['remotes']): MCPServerConfig {
        const remote = remotes![0]
        const config: MCPServerConfig = {
            url: remote.url,
        }

        if (remote.headers && remote.headers.length > 0) {
            config.headers = {}
            remote.headers.forEach((header: { name: string; value: string }) => {
                config.headers![header.name] = header.value
            })
        }

        return config
    }

    private convertLocalServer(packages: McpRegistryServer['packages'], version: string): MCPServerConfig {
        const pkg = packages![0]
        const isNpm = pkg.registryType === MCP_REGISTRY_CONSTANTS.REGISTRY_TYPES.NPM
        const isPypi = pkg.registryType === MCP_REGISTRY_CONSTANTS.REGISTRY_TYPES.PYPI
        const isOci = pkg.registryType === MCP_REGISTRY_CONSTANTS.REGISTRY_TYPES.OCI

        const args: string[] = []

        if (isNpm) {
            args.push(MCP_REGISTRY_CONSTANTS.NPM.FLAG)
        } else if (isOci) {
            args.push(MCP_REGISTRY_CONSTANTS.OCI.FLAG)
        }

        if (isPypi && pkg.registryBaseUrl) {
            args.push('--default-index')
            args.push(pkg.registryBaseUrl)
        }

        if (pkg.runtimeArguments && pkg.runtimeArguments.length > 0) {
            pkg.runtimeArguments.forEach((arg: { type: string; value: string }) => {
                args.push(arg.value)
            })
        }

        if (isOci) {
            const imageRef = pkg.registryBaseUrl
                ? `${pkg.registryBaseUrl}/${pkg.identifier}:${version}`
                : `${pkg.identifier}:${version}`
            args.push(imageRef)
        } else {
            args.push(`${pkg.identifier}@${version}`)
        }

        if (pkg.packageArguments && pkg.packageArguments.length > 0) {
            pkg.packageArguments.forEach((arg: { type: string; value: string }) => {
                args.push(arg.value)
            })
        }

        let command: string
        if (isNpm) {
            command = MCP_REGISTRY_CONSTANTS.NPM.COMMAND
        } else if (isPypi) {
            command = MCP_REGISTRY_CONSTANTS.PYPI.COMMAND
        } else {
            command = MCP_REGISTRY_CONSTANTS.OCI.COMMAND
        }

        const config: MCPServerConfig = {
            command,
            args,
            env: {},
        }

        if (pkg.registryBaseUrl && isNpm) {
            config.env![MCP_REGISTRY_CONSTANTS.NPM.ENV_VAR] = pkg.registryBaseUrl
        }

        if (pkg.environmentVariables && pkg.environmentVariables.length > 0) {
            pkg.environmentVariables.forEach((envVar: { name: string; default: string }) => {
                config.env![envVar.name] = envVar.default
            })
        }

        return config
    }
}
