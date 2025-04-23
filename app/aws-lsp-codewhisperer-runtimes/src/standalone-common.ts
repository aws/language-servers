import { RuntimeProps } from '@aws/language-server-runtimes/runtimes/runtime'
import { Server } from '@aws/language-server-runtimes/server-interface'
import { AmazonQServiceServerToken } from '@aws/lsp-codewhisperer'
import { AmazonQServiceServerIAM } from '@aws/lsp-codewhisperer'

const createRuntimePropsFactory =
    (AmazonQServiceServer: Server) =>
    (version: string, servers: Server[], name = 'AWS CodeWhisperer'): RuntimeProps => {
        return {
            version,
            servers: [AmazonQServiceServer, ...servers],
            name,
        }
    }

export const createIAMRuntimeProps = createRuntimePropsFactory(AmazonQServiceServerIAM)
export const createTokenRuntimeProps = createRuntimePropsFactory(AmazonQServiceServerToken)
