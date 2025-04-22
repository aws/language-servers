import { InitializeParams, Server } from '@aws/language-server-runtimes/server-interface'
import { AmazonQBaseServiceManager, QServiceManagerFeatures } from './amazonQServiceManager/BaseAmazonQServiceManager'
import { initBaseIAMServiceManager } from './amazonQServiceManager/AmazonQIAMServiceManager'
import { initBaseTokenServiceManager } from './amazonQServiceManager/AmazonQTokenServiceManager'

export const AmazonQServiceServerFactory =
    (initServiceManager: (features: QServiceManagerFeatures) => AmazonQBaseServiceManager): Server =>
    ({ credentialsProvider, lsp, workspace, logging, runtime, sdkInitializator }) => {
        let amazonQServiceManager: AmazonQBaseServiceManager

        lsp.addInitializer((_params: InitializeParams) => {
            amazonQServiceManager = initServiceManager({
                credentialsProvider,
                lsp,
                workspace,
                logging,
                runtime,
                sdkInitializator,
            })

            amazonQServiceManager.setupCommonLspHandlers()
            amazonQServiceManager.setupConfigurableLspHandlers()

            return {
                capabilities: {},
                awsServerCapabilities: {},
            }
        })

        logging.log('Amazon Q Service server has been initialised')
        return () => {}
    }

export const AmazonQServiceServerIAM = AmazonQServiceServerFactory(initBaseIAMServiceManager)
export const AmazonQServiceServerToken = AmazonQServiceServerFactory(initBaseTokenServiceManager)
