/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { MynahEventNames } from '../static';
export declare const cancelEvent: (event: Event) => boolean;
export declare class MynahUIGlobalEvents {
    private static instance;
    private readonly listeners;
    private constructor();
    static getInstance: () => MynahUIGlobalEvents;
    /**
     * Subscribe to value changes of a specific item in data store
     * @param eventKey One of the keys in MynahUIDataModel
     * @param handler function will be called with optional data field
     * @returns listenerId which will be necessary to removeListener
     */
    addListener: (eventKey: MynahEventNames, handler: (data?: any) => void) => string;
    /**
     * Unsubscribe from changes of a specific item in data store
     * @param eventKey One of the keys in MynahUIDataModel
     * @param listenerId listenerId which is returned from addListener function
     */
    removeListener: (eventKey: MynahEventNames, listenerId: string) => void;
    /**
     * Updates the store and informs the subscribers.
     * @param data A full or partial set of store data model with values.
     */
    dispatch: (eventKey: MynahEventNames, data?: any) => void;
}
