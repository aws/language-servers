/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { MynahPortalNames } from '../static';
import { AllowedTagsInCustomRenderer, AllowedAttributesInCustomRenderer } from './sanitize';
export declare const DS: typeof document.querySelectorAll;
type GenericEvents = Extract<keyof GlobalEventHandlersEventMap, string>;
export type DomBuilderEventHandler = (event?: any) => any;
export interface DomBuilderEventHandlerWithOptions {
    handler: DomBuilderEventHandler;
    options?: AddEventListenerOptions;
}
interface GenericDomBuilderAttributes {
    attributes?: Record<string, string | boolean> | undefined;
    classNames?: string[] | undefined;
    events?: Partial<Record<GenericEvents, DomBuilderEventHandler | DomBuilderEventHandlerWithOptions>> | undefined;
}
export interface ChatItemBodyRenderer extends GenericDomBuilderAttributes {
    type: AllowedTagsInCustomRenderer;
    children?: Array<string | ChatItemBodyRenderer> | undefined;
    attributes?: Partial<Record<AllowedAttributesInCustomRenderer, string>> | undefined;
}
export interface DomBuilderObject extends GenericDomBuilderAttributes {
    type: string;
    children?: Array<string | DomBuilderObject | HTMLElement | ExtendedHTMLElement> | undefined;
    innerHTML?: string | undefined;
    persistent?: boolean | undefined;
}
export interface DomBuilderObjectFilled {
    attributes?: Record<string, string | undefined>;
    classNames?: string[];
    events?: Record<string, (event?: any) => any>;
    children?: Array<string | DomBuilderObject | HTMLElement | ExtendedHTMLElement>;
    innerHTML?: string | undefined;
    persistent?: boolean;
}
export interface ExtendedHTMLElement extends HTMLInputElement {
    addClass(className: string): ExtendedHTMLElement;
    removeClass(className: string): ExtendedHTMLElement;
    toggleClass(className: string): ExtendedHTMLElement;
    hasClass(className: string): boolean;
    insertChild(position: 'beforebegin' | 'afterbegin' | 'beforeend' | 'afterend', child: string | DomBuilderObject | HTMLElement | ExtendedHTMLElement | Array<string | DomBuilderObject | HTMLElement | ExtendedHTMLElement>): ExtendedHTMLElement;
    clear(removePersistent?: boolean): ExtendedHTMLElement;
    builderObject: DomBuilderObject;
    update(builderObject: DomBuilderObjectFilled): ExtendedHTMLElement;
}
export declare class DomBuilder {
    private static instance;
    private rootFocus;
    root: ExtendedHTMLElement;
    private portals;
    private constructor();
    private readonly attachRootFocusListeners;
    private readonly onRootFocus;
    private readonly onRootBlur;
    readonly setFocusToRoot: () => void;
    static getInstance(rootSelector?: string): DomBuilder;
    setRoot: (rootSelector?: string) => void;
    addClass: (this: ExtendedHTMLElement, className: string) => ExtendedHTMLElement;
    removeClass: (this: ExtendedHTMLElement, className: string) => ExtendedHTMLElement;
    toggleClass: (this: ExtendedHTMLElement, className: string) => ExtendedHTMLElement;
    hasClass: (this: ExtendedHTMLElement, className: string) => boolean;
    insertChild: (this: ExtendedHTMLElement, position: 'beforebegin' | 'afterbegin' | 'beforeend' | 'afterend', child: string | HTMLElement | ExtendedHTMLElement | Array<string | HTMLElement | ExtendedHTMLElement>) => ExtendedHTMLElement;
    clearChildren: (this: ExtendedHTMLElement, removePersistent: boolean) => ExtendedHTMLElement;
    extendDomFunctionality: (this: DomBuilder, domElement: HTMLElement) => ExtendedHTMLElement;
    build: (domBuilderObject: DomBuilderObject) => ExtendedHTMLElement;
    update: (domToUpdate: ExtendedHTMLElement, domBuilderObject: DomBuilderObjectFilled) => ExtendedHTMLElement;
    createPortal: (portalName: string, builderObject: DomBuilderObject, position: 'beforebegin' | 'afterbegin' | 'beforeend' | 'afterend') => ExtendedHTMLElement;
    getPortal: (portalName: string) => ExtendedHTMLElement;
    removePortal: (portalName: string) => void;
    removeAllPortals: (portalsWithName: MynahPortalNames) => void;
}
export declare const htmlDecode: (input: string) => string;
export declare const getTypewriterPartsCss: (typewriterId: string, lastVisibleItemIndex: number, totalNumberOfItems: number, timeForEach: number) => ExtendedHTMLElement;
export {};
