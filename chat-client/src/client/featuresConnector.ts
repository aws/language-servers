import { MynahUI } from '@aws/mynah-ui'
import { Connector } from '../connectors/connector'
import { TabsStorage } from '../connectors/storages/tabsStorage'
import { ConnectorProps } from '../connectors/apps/gumbyChatConnector'

export const createFeaturesConnector = (ref: { mynahUI: MynahUI | undefined }): Connector | undefined => {
    const tabsStorage = new TabsStorage()
    const featuresConnector = new Connector(
        tabsStorage,
        {
            onUpdatePlaceholder(tabID: string, newPlaceholder: string) {
                ref.mynahUI!.updateStore(tabID, {
                    promptInputPlaceholder: newPlaceholder,
                })
            },
            // ...,
        } as ConnectorProps // TODO: remove as ConnectorProps
    )

    // mynahUiProps.onCustomFormAction = ... override

    return featuresConnector
}
