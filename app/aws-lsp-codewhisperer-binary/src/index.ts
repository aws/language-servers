import {
    CodeWhispererServer,
    CodeWhispererServerProps,
    CodeWhispererServiceProps,
    createCodeWhispererService,
} from '@lsp-placeholder/aws-lsp-codewhisperer'
import {
    AwsInitializationOptions,
    EncryptionInitialization,
    IdeCredentialsProvider,
    readEncryptionInitialization,
    shouldWaitForEncryptionKey,
} from '@lsp-placeholder/aws-lsp-core'
import { ProposedFeatures, createConnection } from 'vscode-languageserver/node'

const lspConnection = createConnection(ProposedFeatures.all)

if (shouldWaitForEncryptionKey()) {
    // Before starting the language server, accept encryption initialization details
    // directly from the host. This avoids writing the key to the same channel used
    // to send encrypted data.
    // Contract: Only read up to (and including) the first newline (\n).
    readEncryptionInitialization(process.stdin).then(encryptionInit => {
        createServer(lspConnection, encryptionInit)
    })
} else {
    createServer(lspConnection)
}

function createServer(connection: any, encryptionInit?: EncryptionInitialization): CodeWhispererServer {
    const credentialsProvider = new IdeCredentialsProvider(connection, encryptionInit?.key, encryptionInit?.mode)

    const serviceProps: CodeWhispererServiceProps = {
        displayName: CodeWhispererServer.serverId,
        connection,
        credentialsProvider,
    }

    const service = createCodeWhispererService(serviceProps)

    const props: CodeWhispererServerProps = {
        connection,
        codeWhispererService: service,
        onInitialize: (props: AwsInitializationOptions) => {
            credentialsProvider.initialize(props)
        },
    }

    return new CodeWhispererServer(props)
}
