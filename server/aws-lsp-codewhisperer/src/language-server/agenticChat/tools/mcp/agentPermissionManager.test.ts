/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { expect } from 'chai'
import { AgentPermissionManager } from './agentPermissionManager'
import { AgentConfig, McpPermissionType } from './mcpTypes'

describe('AgentPermissionManager', () => {
    let agentConfig: AgentConfig
    let manager: AgentPermissionManager

    beforeEach(() => {
        agentConfig = {
            name: 'test-agent',
            description: 'Test agent',
            mcpServers: {},
            tools: [],
            allowedTools: [],
        }
        manager = new AgentPermissionManager(agentConfig)
    })

    describe('matchesPattern', () => {
        it('matches exact patterns', () => {
            expect(manager['matchesPattern']('tool1', 'tool1')).to.be.true
            expect(manager['matchesPattern']('tool1', 'tool2')).to.be.false
        })

        it('matches wildcard patterns', () => {
            expect(manager['matchesPattern']('tool1', '*')).to.be.true
            expect(manager['matchesPattern']('tool1', 'tool*')).to.be.true
            expect(manager['matchesPattern']('tool1', '*1')).to.be.true
            expect(manager['matchesPattern']('tool1', 'to*l1')).to.be.true
            expect(manager['matchesPattern']('tool1', 'foo*')).to.be.false
        })

        it('matches question mark patterns', () => {
            expect(manager['matchesPattern']('tool1', 'tool?')).to.be.true
            expect(manager['matchesPattern']('tool1', '?ool1')).to.be.true
            expect(manager['matchesPattern']('tool1', 'tool??')).to.be.false
        })

        it('escapes regex special characters', () => {
            expect(manager['matchesPattern']('tool.1', 'tool.1')).to.be.true
            expect(manager['matchesPattern']('tool+1', 'tool+1')).to.be.true
            expect(manager['matchesPattern']('tool[1]', 'tool[1]')).to.be.true
        })
    })

    describe('isToolEnabled', () => {
        it('returns true for exact tool matches', () => {
            agentConfig.tools = ['tool1', '@server/tool2']
            expect(manager.isToolEnabled('', 'tool1')).to.be.true
            expect(manager.isToolEnabled('server', 'tool2')).to.be.true
        })

        it('returns true for server prefix matches', () => {
            agentConfig.tools = ['@server']
            expect(manager.isToolEnabled('server', 'tool1')).to.be.true
        })

        it('returns true for wildcard matches', () => {
            agentConfig.tools = ['*']
            expect(manager.isToolEnabled('server', 'tool1')).to.be.true

            agentConfig.tools = ['tool*']
            expect(manager.isToolEnabled('', 'tool1')).to.be.true
            expect(manager.isToolEnabled('', 'foo1')).to.be.false
        })

        it('returns false for non-matching tools', () => {
            agentConfig.tools = ['tool1']
            expect(manager.isToolEnabled('', 'tool2')).to.be.false
            expect(manager.isToolEnabled('server', 'tool1')).to.be.false
        })
    })

    describe('isToolAlwaysAllowed', () => {
        it('returns true for exact tool matches', () => {
            agentConfig.allowedTools = ['tool1', '@server/tool2']
            expect(manager.isToolAlwaysAllowed('', 'tool1')).to.be.true
            expect(manager.isToolAlwaysAllowed('server', 'tool2')).to.be.true
        })

        it('returns true for server prefix matches', () => {
            agentConfig.allowedTools = ['@server']
            expect(manager.isToolAlwaysAllowed('server', 'tool1')).to.be.true
        })

        it('returns true for wildcard matches', () => {
            agentConfig.allowedTools = ['tool*']
            expect(manager.isToolAlwaysAllowed('', 'tool1')).to.be.true
            expect(manager.isToolAlwaysAllowed('', 'foo1')).to.be.false
        })

        it('returns false for non-matching tools', () => {
            agentConfig.allowedTools = ['tool1']
            expect(manager.isToolAlwaysAllowed('', 'tool2')).to.be.false
        })
    })

    describe('getToolPermission', () => {
        it('returns alwaysAllow for always allowed tools', () => {
            agentConfig.allowedTools = ['tool1']
            expect(manager.getToolPermission('', 'tool1')).to.equal(McpPermissionType.alwaysAllow)
        })

        it('returns ask for enabled but not always allowed tools', () => {
            agentConfig.tools = ['tool1']
            expect(manager.getToolPermission('', 'tool1')).to.equal(McpPermissionType.ask)
        })

        it('returns deny for non-enabled tools', () => {
            expect(manager.getToolPermission('', 'tool1')).to.equal(McpPermissionType.deny)
        })

        it('prioritizes alwaysAllow over enabled', () => {
            agentConfig.tools = ['tool1']
            agentConfig.allowedTools = ['tool1']
            expect(manager.getToolPermission('', 'tool1')).to.equal(McpPermissionType.alwaysAllow)
        })
    })

    describe('setToolPermission', () => {
        it('sets deny permission correctly', () => {
            agentConfig.tools = ['tool1']
            agentConfig.allowedTools = ['tool1']

            manager.setToolPermission('', 'tool1', McpPermissionType.deny)

            expect(agentConfig.tools).to.not.include('tool1')
            expect(agentConfig.allowedTools).to.not.include('tool1')
        })

        it('sets ask permission correctly', () => {
            manager.setToolPermission('', 'tool1', McpPermissionType.ask)

            expect(agentConfig.tools).to.include('tool1')
            expect(agentConfig.allowedTools).to.not.include('tool1')
        })

        it('sets alwaysAllow permission correctly', () => {
            manager.setToolPermission('', 'tool1', McpPermissionType.alwaysAllow)

            expect(agentConfig.tools).to.include('tool1')
            expect(agentConfig.allowedTools).to.include('tool1')
        })

        it('removes conflicting wildcards', () => {
            agentConfig.tools = ['tool*']
            agentConfig.allowedTools = ['tool*']

            manager.setToolPermission('', 'tool1', McpPermissionType.deny)

            expect(agentConfig.tools).to.not.include('tool*')
            expect(agentConfig.allowedTools).to.not.include('tool*')
        })

        it('handles server-scoped tools', () => {
            manager.setToolPermission('server', 'tool1', McpPermissionType.ask)

            expect(agentConfig.tools).to.include('@server/tool1')
        })
    })

    describe('setServerPermission', () => {
        it('sets deny permission for entire server', () => {
            agentConfig.tools = ['@server', '@server/tool1']
            agentConfig.allowedTools = ['@server/tool2']

            manager.setServerPermission('server', McpPermissionType.deny)

            expect(agentConfig.tools).to.not.include('@server')
            expect(agentConfig.tools).to.not.include('@server/tool1')
            expect(agentConfig.allowedTools).to.not.include('@server/tool2')
        })

        it('sets ask permission for entire server', () => {
            manager.setServerPermission('server', McpPermissionType.ask)

            expect(agentConfig.tools).to.include('@server')
            expect(agentConfig.allowedTools).to.not.include('@server')
        })

        it('sets alwaysAllow permission for entire server', () => {
            manager.setServerPermission('server', McpPermissionType.alwaysAllow)

            expect(agentConfig.tools).to.include('@server')
            expect(agentConfig.allowedTools).to.include('@server')
        })

        it('removes specific tools when setting server permission', () => {
            agentConfig.tools = ['@server/tool1', '@server/tool2']
            agentConfig.allowedTools = ['@server/tool3']

            manager.setServerPermission('server', McpPermissionType.ask)

            expect(agentConfig.tools).to.not.include('@server/tool1')
            expect(agentConfig.tools).to.not.include('@server/tool2')
            expect(agentConfig.allowedTools).to.not.include('@server/tool3')
            expect(agentConfig.tools).to.include('@server')
        })
    })

    describe('getAgentConfig', () => {
        it('returns the current agent config', () => {
            const config = manager.getAgentConfig()
            expect(config).to.equal(agentConfig)
        })
    })
})
