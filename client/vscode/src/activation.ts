/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as cp from 'child_process'
import * as path from 'path'

import { ExtensionContext, workspace } from 'vscode'

import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node'
import {
    configureCredentialsCapabilities,
    registerBearerTokenProviderSupport,
    registerIamCredentialsProviderSupport,
    writeEncryptionInit,
} from './credentialsActivation'
import { registerInlineCompletion } from './inlineCompletionActivation'
import { registerLogCommand,registerTransformCommand } from './sampleCommandActivation'

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
    const enableEncryptionInit = enableIamProvider || enableBearerTokenProvider

    const debugOptions = { execArgv: ['--nolazy', '--inspect=6012', '--preserve-symlinks'] }

    // If the extension is launch in debug mode the debug server options are use
    // Otherwise the run options are used
    let serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc, options: debugOptions },
        debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions },
    }

    if (enableEncryptionInit) {
        // If the host is going to encrypt credentials,
        // receive the encryption key over stdin before starting the language server.
        debugOptions.execArgv.push('--stdio')
        // Used by the proof of concept language servers (we can remove this one in the future,
        // after all language servers are based on the language-server-runtime).
        debugOptions.execArgv.push('--pre-init-encryption')
        // Used by the aws-language-server-runtime based servers
        debugOptions.execArgv.push('--set-credentials-encryption-key')
        const child = cp.spawn('node', [serverModule, ...debugOptions.execArgv])
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
        ],
        initializationOptions: {},
        synchronize: {
            fileEvents: workspace.createFileSystemWatcher('**/*.{json,yml,yaml,ts}'),
        },
    }

    configureCredentialsCapabilities(clientOptions, enableIamProvider, enableBearerTokenProvider)

    // Create the language client and start the client.
    const client = new LanguageClient('awsDocuments', 'AWS Documents Language Server', serverOptions, clientOptions)

    if (enableIamProvider) {
        await registerIamCredentialsProviderSupport(client, extensionContext)
    }

    if (enableBearerTokenProvider) {
        await registerBearerTokenProviderSupport(client, extensionContext)
    }

    if (enableInlineCompletion) {
        registerInlineCompletion(client)
    }

    const enableCustomCommands = process.env.ENABLE_CUSTOM_COMMANDS === 'true'
    if (enableCustomCommands) {
        await registerLogCommand(client, extensionContext)
        await registerTransformCommand(client, extensionContext)
    }

    client.start()

    return client
}
