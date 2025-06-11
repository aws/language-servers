import {
    CancellationToken,
    CredentialsType,
    InitializeParams,
    Server,
    UpdateConfigurationParams,
} from '@aws/language-server-runtimes/server-interface'
import {
    BaseAmazonQServiceManager,
    initBaseServiceManager,
    QServiceManagerFeatures,
} from './amazonQServiceManager/BaseAmazonQServiceManager'
// import { initBaseIAMServiceManager } from './amazonQServiceManager/AmazonQIAMServiceManager'
// import { initBaseTokenServiceManager } from './amazonQServiceManager/AmazonQTokenServiceManager'

const LOGGING_PREFIX = '[AMAZON Q SERVER]: '

export const AmazonQServiceServerFactory =
    (serviceManager: (features: QServiceManagerFeatures) => BaseAmazonQServiceManager): Server =>
    ({ credentialsProvider, lsp, workspace, logging, runtime, sdkInitializator }) => {
        let amazonQServiceManager: BaseAmazonQServiceManager

        const log = (message: string) => {
            logging.debug(`${LOGGING_PREFIX}${message}`)
        }

        /*
             The service manager relies on client params to fully initialize, so the initialization needs
             to be deferred to the LSP handshake. Dependent servers may assume the service manager is 
             available when the initialized notification has been received.
            */
        lsp.addInitializer((_params: InitializeParams) => {
            amazonQServiceManager = serviceManager({
                credentialsProvider,
                lsp,
                workspace,
                logging,
                runtime,
                sdkInitializator,
            })

            return {
                capabilities: {},
                awsServerCapabilities: {},
            }
        })

        lsp.onInitialized(async () => {
            log('Received onInitialized notification')
            await amazonQServiceManager.handleDidChangeConfiguration()
        })

        lsp.didChangeConfiguration(async () => {
            log('Received didChangeConfiguration notification')
            await amazonQServiceManager.handleDidChangeConfiguration()
        })

        lsp.workspace.onUpdateConfiguration(async (params: UpdateConfigurationParams, token: CancellationToken) => {
            log('Received onUpdateConfiguration request')
            await amazonQServiceManager.handleOnUpdateConfiguration(params, token)
        })

        credentialsProvider.onCredentialsDeleted(() => {
            log('Received onCredentialsDeleted notification')
            amazonQServiceManager.handleOnCredentialsDeleted()
        })

        logging.log('Amazon Q Service server has been initialised')
        return () => {}
    }

export const BaseAmazonQServiceServer = AmazonQServiceServerFactory(initBaseServiceManager)
