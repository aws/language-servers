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

        const config: MCPServerConfig = {
            command: isNpm ? MCP_REGISTRY_CONSTANTS.NPM.COMMAND : MCP_REGISTRY_CONSTANTS.PYPI.COMMAND,
            args: isNpm
                ? [MCP_REGISTRY_CONSTANTS.NPM.FLAG, `${pkg.identifier}@${version}`]
                : [`${pkg.identifier}@${version}`],
            env: {},
        }

        if (pkg.registryBaseUrl) {
            if (isNpm) {
                config.env![MCP_REGISTRY_CONSTANTS.NPM.ENV_VAR] = pkg.registryBaseUrl
            } else if (isPypi) {
                config.env![MCP_REGISTRY_CONSTANTS.PYPI.ENV_VAR] = pkg.registryBaseUrl
            }
        }

        if (pkg.packageArguments && pkg.packageArguments.length > 0) {
            pkg.packageArguments.forEach((arg: { type: string; value: string }) => {
                config.args!.push(arg.value)
            })
        }

        if (pkg.environmentVariables && pkg.environmentVariables.length > 0) {
            pkg.environmentVariables.forEach((envVar: { name: string; default: string }) => {
                config.env![envVar.name] = envVar.default
            })
        }

        return config
    }
}
