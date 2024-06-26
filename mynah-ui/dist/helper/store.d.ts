/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { MynahUIDataModel } from '../static';
export declare class EmptyMynahUIDataModel {
    data: Required<MynahUIDataModel>;
    constructor(defaults?: MynahUIDataModel | null);
}
export declare class MynahUIDataStore {
    private readonly subscriptions;
    private readonly tabId;
    private store;
    private defaults;
    constructor(tabId: string, initialData?: MynahUIDataModel);
    /**
     * Sets the defaults to use while clearing the store
     * @param defaults partial set of MynahUIDataModel for defaults
     */
    setDefaults: (defaults: MynahUIDataModel | null) => void;
    /**
     * Get the defaults to use while generating an empty store data
     */
    getDefaults: () => MynahUIDataModel | null;
    /**
     * Get the current store data
     */
    getStore: () => MynahUIDataModel | null;
    /**
     * Subscribe to value changes of a specific item in data store
     * @param storeKey One of the keys in MynahUIDataModel
     * @param handler function will be called when value of the given key is updated in store with new and old values
     * @returns subscriptionId which needed to unsubscribe
     */
    subscribe: (storeKey: keyof MynahUIDataModel, handler: (newValue: any, oldValue?: any) => void) => string;
    /**
     * Unsubscribe from changes of a specific item in data store
     * @param storeKey One of the keys in MynahUIDataModel
     * @param subscriptionId subscriptionId which is returned from subscribe function
     */
    unsubscribe: (storeKey: keyof MynahUIDataModel, subscriptionId: string) => void;
    /**
     * Returns current value of an item in data store
     * @param storeKey One of the keys in MynahUIDataModel
     * @returns value of the given key in data store
     */
    getValue: (storeKey: keyof MynahUIDataModel) => any;
    /**
     * Returns current value of an item in data store
     * @param storeKey One of the keys in MynahUIDataModel
     * @returns value of the given key in data store
     */
    getDefaultValue: (storeKey: keyof MynahUIDataModel) => any;
    /**
     * Updates the store and informs the subscribers.
     * @param data A full or partial set of store data model with values.
     */
    updateStore: (data: MynahUIDataModel, skipSubscribers?: boolean) => void;
    /**
     * Clears store data and informs all the subscribers
     */
    resetStore: () => void;
}
