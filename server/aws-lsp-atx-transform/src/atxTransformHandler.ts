import { createConnection, TextDocuments, ProposedFeatures, TextDocumentSyncKind } from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import {
    ElasticGumbyFrontendClient,
    ListWorkspacesCommand,
    CreateWorkspaceCommand,
    VerifySessionCommand,
} from '@amazon/elastic-gumby-frontend-client'

// Create FES client
const fesClient = new ElasticGumbyFrontendClient({
    region: 'us-east-1',
})

// Create connection
const connection = createConnection(ProposedFeatures.all)
const documents = new TextDocuments(TextDocument)

// VerifySession endpoint
connection.onRequest('aws/qNetTransform/verifySession', async (params: any) => {
    try {
        const command = new VerifySessionCommand(params)
        const response = await fesClient.send(command)
        return response
    } catch (error) {
        console.error('verifySession error:', error)
        return { error: 'Failed to verify session' }
    }
})

// ListWorkspaces endpoint
connection.onRequest('aws/qNetTransform/listWorkspaces', async (params: any) => {
    try {
        const command = new ListWorkspacesCommand(params)
        const response = await fesClient.send(command)
        return response
    } catch (error) {
        console.error('listWorkspaces error:', error)
        return { error: 'Failed to list workspaces' }
    }
})

// CreateWorkspace endpoint
connection.onRequest('aws/qNetTransform/createWorkspace', async (params: any) => {
    try {
        const command = new CreateWorkspaceCommand(params)
        const response = await fesClient.send(command)
        return response
    } catch (error) {
        console.error('createWorkspace error:', error)
        return { error: 'Failed to create workspace' }
    }
})

// Initialize
connection.onInitialize(() => {
    return {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
        },
    }
})

connection.onInitialized(() => {
    console.log('ATX Transform Language Server initialized')
})

// Start listening
documents.listen(connection)
connection.listen()
