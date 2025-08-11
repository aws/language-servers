/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { expect } from 'chai'
import * as sinon from 'sinon'
import { McpEventHandler } from './mcpEventHandler'
import { McpManager } from './mcpManager'
import * as mcpUtils from './mcpUtils'
import { getGlobalAgentConfigPath } from './mcpUtils'
import { TelemetryService } from '../../../../shared/telemetry/telemetryService'

describe('McpEventHandler error handling', () => {
    // Mock getGlobalAgentConfigPath to return a test path
    beforeEach(() => {
        sinon.stub(mcpUtils, 'getGlobalAgentConfigPath').returns('/fake/home/.aws/amazonq/agents/default.json')
        saveAgentConfigStub = sinon.stub(mcpUtils, 'saveAgentConfig').resolves()
    })
    let eventHandler: McpEventHandler
    let features: any
    let telemetryService: TelemetryService
    let loadStub: sinon.SinonStub
    let saveAgentConfigStub: sinon.SinonStub

    beforeEach(() => {
        sinon.restore()

        // Create fake features
        features = {
            logging: {
                log: sinon.spy(),
                info: sinon.spy(),
                warn: sinon.spy(),
                error: sinon.spy(),
                debug: sinon.spy(),
            },
            workspace: {
                fs: {
                    exists: sinon.stub().resolves(false),
                    readFile: sinon.stub().resolves(Buffer.from('{}')),
                    writeFile: sinon.stub().resolves(undefined),
                    getUserHomeDir: sinon.stub().returns('/fake/home'),
                },
                getAllWorkspaceFolders: sinon.stub().returns([{ uri: '/fake/workspace' }]),
            },
            chat: {
                sendChatUpdate: sinon.spy(),
            },
            agent: {
                getTools: sinon.stub().returns([]),
                getBuiltInToolNames: sinon.stub().returns([]),
            },
            lsp: {},
            telemetry: {
                emitMetric: sinon.spy(),
                onClientTelemetry: sinon.stub(),
            },
            credentialsProvider: {
                getConnectionMetadata: sinon.stub().returns({}),
            },
            runtime: {
                serverInfo: {
                    version: '1.0.0',
                },
            },
        }

        // Create mock telemetry service
        telemetryService = {
            emitUserTriggerDecision: sinon.stub(),
            emitChatInteractWithMessage: sinon.stub(),
            emitUserModificationEvent: sinon.stub(),
            emitCodeCoverageEvent: sinon.stub(),
        } as unknown as TelemetryService

        // Create the event handler
        eventHandler = new McpEventHandler(features, telemetryService)

        // Default loadAgentConfig stub will be set in each test as needed
    })

    afterEach(async () => {
        sinon.restore()
        try {
            await McpManager.instance.close()
        } catch {}
    })

    it('displays config load errors in the header status', async () => {
        // Create mock errors
        const mockErrors = new Map<string, string>([
            ['file1.json', 'File not found error'],
            ['serverA', 'Missing command error'],
        ])

        // Stub loadAgentConfig to return errors
        loadStub = sinon.stub(mcpUtils, 'loadAgentConfig').resolves({
            servers: new Map(),
            serverNameMapping: new Map(),
            errors: mockErrors,
            agentConfig: {
                name: 'test-agent',
                version: '1.0.0',
                description: 'Test agent',
                mcpServers: {},
                tools: [],
                allowedTools: [],
                toolsSettings: {},
                includedFiles: [],
                resources: [],
            },
        })

        // Initialize McpManager with errors
        await McpManager.init([], features)

        // Stub getConfigLoadErrors to return formatted errors
        sinon
            .stub(McpManager.instance, 'getConfigLoadErrors')
            .returns('File: file1.json, Error: File not found error\n\nFile: serverA, Error: Missing command error')

        // Call onListMcpServers
        const result = await eventHandler.onListMcpServers({})

        // Verify error is displayed in header status
        expect(result.header).to.not.be.undefined
        expect(result.header.status).to.not.be.undefined
        expect(result.header.status!.status).to.equal('error')
        expect(result.header.status!.title).to.include('File: file1.json, Error: File not found error')
        expect(result.header.status!.title).to.include('File: serverA, Error: Missing command error')
    })

    it('marks servers with validation errors as FAILED', async () => {
        // Create a server config with an error
        const serverConfig = new Map([
            [
                'errorServer',
                {
                    command: '', // Invalid - missing command
                    args: [],
                    env: {},
                    disabled: false,
                    __configPath__: 'config.json',
                },
            ],
        ])

        // Make sure previous stubs are restored
        sinon.restore()
        sinon.stub(mcpUtils, 'getGlobalAgentConfigPath').returns('/fake/home/.aws/amazonq/agents/default.json')
        saveAgentConfigStub = sinon.stub(mcpUtils, 'saveAgentConfig').resolves()

        // Stub loadAgentConfig to return a server with validation errors
        loadStub = sinon.stub(mcpUtils, 'loadAgentConfig').resolves({
            servers: serverConfig,
            serverNameMapping: new Map(),
            errors: new Map([['errorServer', 'Missing command error']]),
            agentConfig: {
                name: 'test-agent',
                version: '1.0.0',
                description: 'Test agent',
                mcpServers: { errorServer: { command: '' } },
                tools: ['@errorServer'],
                allowedTools: [],
                toolsSettings: {},
                includedFiles: [],
                resources: [],
            },
        })

        // Initialize McpManager with the problematic server
        await McpManager.init([], features)

        // Stub getAllServerConfigs to return our test server
        sinon.stub(McpManager.instance, 'getAllServerConfigs').returns(serverConfig)

        // Stub getConfigLoadErrors to return formatted errors
        sinon
            .stub(McpManager.instance, 'getConfigLoadErrors')
            .returns('File: errorServer, Error: Missing command error')

        // Call onListMcpServers
        const result = await eventHandler.onListMcpServers({})

        // Find the server in the result
        const serverGroup = result.list.find(
            group => group.children && group.children.some(item => item.title === 'errorServer')
        )

        expect(serverGroup).to.not.be.undefined
        expect(serverGroup?.children).to.not.be.undefined

        const serverItem = serverGroup?.children?.find(item => item.title === 'errorServer')
        expect(serverItem).to.not.be.undefined
        expect(serverItem?.children).to.not.be.undefined
        expect(serverItem?.children?.[0]).to.not.be.undefined
        expect(serverItem?.children?.[0].children).to.not.be.undefined

        // Find the status in the server item's children
        const statusItem = serverItem?.children?.[0].children?.find(item => item.title === 'status')
        expect(statusItem).to.not.be.undefined
        expect(statusItem?.description).to.equal('FAILED')
    })

    it('handles server click events for fixing failed servers', async () => {
        // Make sure previous stubs are restored
        sinon.restore()
        sinon.stub(mcpUtils, 'getGlobalAgentConfigPath').returns('/fake/home/.aws/amazonq/agents/default.json')
        saveAgentConfigStub = sinon.stub(mcpUtils, 'saveAgentConfig').resolves()

        // Stub loadAgentConfig
        loadStub = sinon.stub(mcpUtils, 'loadAgentConfig').resolves({
            servers: new Map(),
            serverNameMapping: new Map(),
            errors: new Map(),
            agentConfig: {
                name: 'test-agent',
                version: '1.0.0',
                description: 'Test agent',
                mcpServers: {},
                tools: [],
                allowedTools: [],
                toolsSettings: {},
                includedFiles: [],
                resources: [],
            },
        })

        // Initialize McpManager
        await McpManager.init([], features)

        // Call onMcpServerClick with mcp-fix-server action
        const result = await eventHandler.onMcpServerClick({
            id: 'mcp-fix-server',
            title: 'errorServer',
        })

        // Verify it redirects to edit server view
        expect(result.id).to.equal('mcp-fix-server')
        expect(result.header).to.not.be.undefined
        expect(result.header.title).to.equal('Edit MCP Server')
    })
})
