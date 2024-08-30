import {
    CredentialsProvider,
    Logging,
    Lsp,
    RequestType,
    Rpc,
    Server,
    Telemetry,
    Workspace,
} from '@aws/language-server-runtimes/server-interface'
import { ParameterStructures } from 'vscode-languageserver'
import { EmbeddedRpc } from '@aws/language-server-runtimes/server-interface/rpc'

interface MyTestRequestParams {
    myParam: string
}

interface MyTestRequestResult {
    myResult: boolean
}

interface MyTestRequestError {
    myError: string
}

const myTestRequestType = new RequestType<MyTestRequestParams, MyTestRequestResult, MyTestRequestError>(
    '/aws/myTestRequest',
    ParameterStructures.auto
)

const myTestRequestHandler = (params: MyTestRequestParams): MyTestRequestResult | MyTestRequestError => {
    return {
        myResult: false,
    }
}

interface MyServerProcParams {
    myParam: string
}

interface MyServerProcResult {
    myResult: string
}

interface MyServerProcError {
    myError: string
}

const myServerProcType = new RequestType<MyServerProcParams, MyServerProcResult, MyServerProcError>('/aws/myServerProc')

interface MyClientProcParams {
    myParam2: string
}

interface MyClientProcResult {
    myResult2: string
}

interface MyClientProcError {
    myError2: string
}

const myClientProcType = new RequestType<MyClientProcParams, MyClientProcResult, MyClientProcError>('/aws/myClientProc')

export const IdentityServer: Server = (features: {
    credentialsProvider: CredentialsProvider
    lsp: Lsp
    workspace: Workspace
    logging: Logging
    telemetry: Telemetry
}) => {
    const { lsp } = features

    lsp.addInitializer(() => {
        return {
            capabilities: {},
        }
    })

    lsp.addRpcIntitializer((rpc: Rpc, embeddedRpc: EmbeddedRpc) => {
        rpc.onRequest(myTestRequestType, myTestRequestHandler)

        const myClientProc = embeddedRpc.stub(myClientProcType)

        embeddedRpc.on(myServerProcType, (params: MyServerProcParams) => {
            setTimeout(async () => {
                const result = await myClientProc({ myParam2: 'Yay! MyClientProc call made it.' })
                embeddedRpc.connection.window.showInformationMessage(`The server got MyProcResult: ${result.myResult2}`)
            }, 5000)
            return {
                myResult: `MyServerProc returned this result with myParam: ${params.myParam}`,
            }
        })
    })

    // Disposable
    return () => {
        // Do nothing
    }
}
