/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

export const MCP_REGISTRY_CONSTANTS = {
    MAX_REGISTRY_URL_LENGTH: 1024,
    MAX_SERVER_NAME_LENGTH: 255,
    TRANSPORT_TYPES: {
        STREAMABLE_HTTP: 'streamable-http' as const,
        SSE: 'sse' as const,
        STDIO: 'stdio' as const,
    },
    REGISTRY_TYPES: {
        NPM: 'npm' as const,
        PYPI: 'pypi' as const,
    },
    PACKAGE_ARGUMENT_TYPE: {
        POSITIONAL: 'positional' as const,
    },
    NPM: {
        COMMAND: 'npx',
        FLAG: '-y',
        ENV_VAR: 'NPM_CONFIG_REGISTRY',
    },
    PYPI: {
        COMMAND: 'uvx',
        ENV_VAR: 'UV_DEFAULT_INDEX',
    },
} as const
