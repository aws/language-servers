/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as cp from 'child_process'
import * as path from 'path'

import { ExtensionContext, workspace, env, version } from 'vscode'

import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node'
import { registerChat } from './chatActivation'
import {
    configureCredentialsCapabilities,
    encryptionKey,
    registerBearerTokenProviderSupport,
    registerIamCredentialsProviderSupport,
    writeEncryptionInit,
} from './credentialsActivation'
import { registerInlineCompletion } from './inlineCompletionActivation'
import { registerLogCommand, registerTransformCommand } from './sampleCommandActivation'
import { randomUUID } from 'crypto'
import { registerCustomizations } from './customizationActivation'
import { registerIdentity } from './identityActivation'
import { registerNotification } from './notificationActivation'
import { registerQProfileSelection } from './selectQProfileActivation'

export async function activateDocumentsLanguageServer(extensionContext: ExtensionContext) {
    /**
     * In launch.json when we launch as vscode extension we set
     * "--extensionDevelopmentPath=${workspaceFolder}/client/vscode"
     * the output of extensionContext.extension path will be this directory.
     *
     * We do this so that we can use the package.json for the client, and
     * not the package.json for the server which is in the root.
     *
     * Additonally, this is why we use multiple '..', to get to the output directory
     * with the javascript files.
     *
     * To load this sample language client with a specific language server,
     * set the LSP_SERVER environment variable to the server's main
     * .js entrypoint.
     */
    const fallbackPath = path.join(extensionContext.extensionPath, '../../../out/src/server/server.js')
    const serverModule = process.env.LSP_SERVER ?? fallbackPath

    /**
     * If you are iterating with a language server that uses inline completion,
     * set the ENABLE_INLINE_COMPLETION environment variable to "true".
     * This will set up the extension's inline completion provider to get recommendations
     * from the language server.
     */
    const enableInlineCompletion = process.env.ENABLE_INLINE_COMPLETION === 'true'

    /**
     * If you are iterating with a language server that uses credentials...
     * set envvar ENABLE_IAM_PROVIDER to "true" if this extension is expected to provide IAM Credentials
     * set envvar ENABLE_TOKEN_PROVIDER to "true" if this extension is expected to provide bearer tokens
     */
    const enableIamProvider = process.env.ENABLE_IAM_PROVIDER === 'true'
    const enableBearerTokenProvider = process.env.ENABLE_TOKEN_PROVIDER === 'true'
    const enableEncryptionInit = process.env.ENABLE_ENCRYPTION === 'true'

    const debugOptions = { execArgv: ['--nolazy', '--inspect=6012'] }

    // If the extension is launch in debug mode the debug server options are use
    // Otherwise the run options are used
    let serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc, options: debugOptions },
        debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions },
    }

    const scriptOptions = []
    if (enableEncryptionInit) {
        // If the host is going to encrypt credentials,
        // receive the encryption key over stdin before starting the language server.
        scriptOptions.push('--stdio')
        // Used by the proof of concept language servers (we can remove this one in the future,
        // after all language servers are based on the language-server-runtime).
        scriptOptions.push('--pre-init-encryption')
        // Used by the aws-language-server-runtime based servers
        scriptOptions.push('--set-credentials-encryption-key')

        // debugOptions are node process arguments and scriptOptions are script arguments
        const child = cp.spawn('node', [...debugOptions.execArgv, serverModule, ...scriptOptions])

        writeEncryptionInit(child.stdin)

        serverOptions = () => Promise.resolve(child)
    }

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        // Register the server for json documents
        documentSelector: [
            // yaml/json is illustrative of static filetype handling language servers
            { scheme: 'file', language: 'yaml' },
            { scheme: 'untitled', language: 'yaml' },
            { scheme: 'file', language: 'json' },
            { scheme: 'untitled', language: 'json' },
            // typescript is illustrative of code-handling language servers
            { scheme: 'file', language: 'typescript' },
            { scheme: 'untitled', language: 'typescript' },
            { scheme: 'file', language: 'javascript' },
            { scheme: 'untitled', language: 'javascript' },
            // java is illustrative of code-handling language servers
            { scheme: 'file', language: 'java' },
            { scheme: 'untitled', language: 'java' },
            // partiql is illustrative of query-handling language servers
            { scheme: 'file', language: 'partiql' },
            { scheme: 'untitled', language: 'partiql' },
            { scheme: 'file', language: 'go' },
            { scheme: 'untitled', language: 'go' },
            { scheme: 'file', language: 'php' },
            { scheme: 'untitled', language: 'php' },
            { scheme: 'file', language: 'rust' },
            { scheme: 'untitled', language: 'rust' },
            { scheme: 'file', language: 'kotlin' },
            { scheme: 'untitled', language: 'kotlin' },
            { scheme: 'file', language: 'terraform' },
            { scheme: 'untitled', language: 'terraform' },
            { scheme: 'file', language: 'ruby' },
            { scheme: 'untitled', language: 'ruby' },
            { scheme: 'file', language: 'shellscript' },
            { scheme: 'untitled', language: 'shellscript' },
            { scheme: 'file', language: 'scala' },
            { scheme: 'untitled', language: 'scala' },
            { scheme: 'file', language: 'dart' },
            { scheme: 'untitled', language: 'dart' },
            { scheme: 'file', language: 'lua' },
            { scheme: 'untitled', language: 'lua' },
            { scheme: 'file', language: 'powershell' },
            { scheme: 'untitled', language: 'powershell' },
            { scheme: 'file', language: 'r' },
            { scheme: 'untitled', language: 'r' },
            { scheme: 'file', language: 'swift' },
            { scheme: 'untitled', language: 'swift' },
            { scheme: 'file', language: 'systemverilog' },
            { scheme: 'untitled', language: 'systemverilog' },
            { scheme: 'file', language: 'vue' },
            { scheme: 'untitled', language: 'vue' },
            { scheme: 'file', language: 'csharp' },
            { scheme: 'untitled', language: 'csharp' },
        ],
        initializationOptions: {
            aws: {
                clientInfo: {
                    name: env.appName,
                    version: version,
                    extension: {
                        name: 'Sample Extension for VSCode',
                        version: '0.0.1',
                    },
                    clientId: randomUUID(),
                },
                awsClientCapabilities: {
                    window: {
                        notifications: true,
                    },
                },
            },
        },
        synchronize: {
            fileEvents: workspace.createFileSystemWatcher(
                '**/*.{json,java,yml,yaml,ts,pql,go,php,rs,kt,tf,hcl,rb,sh,scala,sv,svh,vh,dart,lua,wlua,swift,vue,ps1,psm1,r}'
            ),
        },
    }

    configureCredentialsCapabilities(clientOptions, enableIamProvider, enableBearerTokenProvider)

    // Create the language client and start the client.
    const client = new LanguageClient('awsDocuments', 'AWS Documents Language Server', serverOptions, clientOptions)

    if (enableIamProvider) {
        await registerIamCredentialsProviderSupport(client, extensionContext, enableEncryptionInit)
    }

    if (enableBearerTokenProvider) {
        await registerBearerTokenProviderSupport(client, extensionContext, enableEncryptionInit)
    }

    if (enableInlineCompletion) {
        registerInlineCompletion(client)
    }

    const enableCustomCommands = process.env.ENABLE_CUSTOM_COMMANDS === 'true'
    if (enableCustomCommands) {
        await registerLogCommand(client, extensionContext)
        await registerTransformCommand(client, extensionContext)
    }

    // Activate chat server after LSP initialize handshake is done
    const enableChat = process.env.ENABLE_CHAT === 'true'
    if (enableChat) {
        registerChat(client, extensionContext.extensionUri, enableEncryptionInit ? encryptionKey : undefined)
    }

    const enableCustomizations = process.env.ENABLE_CUSTOMIZATIONS === 'true'
    if (enableCustomizations) {
        registerCustomizations(client)
    }

    const enableIdentity = process.env.ENABLE_IDENTITY === 'true'
    if (enableIdentity) {
        await registerIdentity(client)
    }

    const enableNotification = process.env.ENABLE_NOTIFICATION === 'true'
    if (enableNotification) {
        await registerNotification(client)
    }

    const enableAmazonQProfiles = process.env.AMAZON_Q_PROFILES === 'true'
    if (enableAmazonQProfiles) {
        await registerQProfileSelection(client)
    }

    return client
}
