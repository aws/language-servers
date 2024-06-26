import { MynahUIDataModel, MynahUITabStoreModel, MynahUITabStoreTab } from '../static';
import { MynahUIDataStore } from './store';
interface TabStoreSubscription {
    'add': Record<string, (tabId: string, tabData?: MynahUITabStoreTab) => void>;
    'remove': Record<string, (tabId: string, newSelectedTab?: MynahUITabStoreTab) => void>;
    'update': Record<string, (tabId: string, tabData?: MynahUITabStoreTab) => void>;
    'selectedTabChange': Record<string, (tabId: string, previousSelectedTab?: MynahUITabStoreTab) => void>;
}
export declare class EmptyMynahUITabsStoreModel {
    data: Required<MynahUITabStoreModel>;
    constructor();
}
export declare class MynahUITabsStore {
    private static instance;
    private readonly subscriptions;
    private readonly tabDefaults;
    private readonly tabsStore;
    private readonly tabsDataStore;
    private constructor();
    private readonly deselectAllTabs;
    readonly addTab: (tabData?: MynahUITabStoreTab) => string | undefined;
    readonly removeTab: (tabId: string) => string;
    readonly selectTab: (tabId: string) => void;
    /**
     * Updates the store and informs the subscribers.
     * @param data A full or partial set of store data model with values.
     */
    updateTab: (tabId: string, tabData?: Partial<MynahUITabStoreTab>, skipSubscribers?: boolean) => void;
    static getInstance: (initialData?: MynahUITabStoreModel, defaults?: MynahUITabStoreTab) => MynahUITabsStore;
    /**
     * Subscribe to changes of the tabsStore
     * @param handler function will be called when tabs changed
     * @returns subscriptionId which needed to unsubscribe
     */
    addListener: (eventName: keyof TabStoreSubscription, handler: (tabId: string, tabData?: MynahUITabStoreTab) => void) => string;
    /**
     * Subscribe to changes of the tabs' data store
     * @param handler function will be called when tabs changed
     * @returns subscriptionId which needed to unsubscribe
     */
    addListenerToDataStore: (tabId: string, storeKey: keyof MynahUIDataModel, handler: (newValue: any, oldValue?: any) => void) => string | null;
    /**
     * Unsubscribe from changes of the tabs' data store
     * @param handler function will be called when tabs changed
     * @returns subscriptionId which needed to unsubscribe
     */
    removeListenerFromDataStore: (tabId: string, subscriptionId: string, storeKey: keyof MynahUIDataModel) => void;
    /**
     * Unsubscribe from changes of the tabs store
     * @param subscriptionId subscriptionId which is returned from subscribe function
     */
    removeListener: (eventName: keyof TabStoreSubscription, subscriptionId: string) => void;
    private readonly informSubscribers;
    /**
     * Returns the tab
     * @param tabId Tab Id
     * @returns info of the tab
     */
    getTab: (tabId: string) => MynahUITabStoreTab | null;
    /**
     * Returns the tab
     * @param tabId Tab Id
     * @returns info of the tab
     */
    getAllTabs: () => MynahUITabStoreModel;
    /**
     * Returns the data store of the tab
     * @param tabId Tab Id
     * @returns data of the tab
     */
    getTabDataStore: (tabId: string) => MynahUIDataStore;
    /**
     * Returns the data of the tab
     * @param tabId Tab Id
     * @returns data of the tab
     */
    getSelectedTabId: () => string;
    /**
     * Clears store data and informs all the subscribers
     */
    removeAllTabs: () => void;
    /**
     * Get all tabs length
     * @returns tabs length
     */
    tabsLength: () => number;
}
export {};
