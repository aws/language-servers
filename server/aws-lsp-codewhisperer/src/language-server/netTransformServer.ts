import {
    Server,
    CredentialsProvider,
    CancellationToken,
    ExecuteCommandParams,
} from '@aws/language-server-runtimes/server-interface'
import { CodeWhispererServiceToken } from './codeWhispererService'

/**
 *
 * @param createService Inject service instance based on credentials provider.
 * @returns  NetTransform server
 */
export const NetTransformServerFactory: (
    createService: (credentialsProvider: CredentialsProvider) => CodeWhispererServiceToken
) => Server =
    createService =>
    ({ credentialsProvider, lsp, workspace, telemetry, logging }) => {
        const service = createService(credentialsProvider)
        const onExecuteCommandHandler = async (
            params: ExecuteCommandParams,
            _token: CancellationToken
        ): Promise<any> => {
            //Placeholder for logic
        }

        // Do the thing
        lsp.onExecuteCommand(onExecuteCommandHandler)

        // Disposable
        return () => {
            // Do nothing
        }
    }

/**
 * Default NetTransformServer using Token authentication.
 */
export const NetTransformServer = NetTransformServerFactory(
    credentialsProvider => new CodeWhispererServiceToken(credentialsProvider, {})
)
