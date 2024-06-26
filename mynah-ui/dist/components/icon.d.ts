/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ExtendedHTMLElement } from '../helper/dom';
import '../styles/components/_icon.scss';
export declare enum MynahIcons {
    Q = "q",
    MENU = "menu",
    MINUS = "minus",
    SEARCH = "search",
    PLUS = "plus",
    PAPER_CLIP = "paper-clip",
    LIST_ADD = "list-add",
    TABS = "tabs",
    CHAT = "chat",
    LINK = "link",
    FOLDER = "folder",
    FILE = "file",
    DOC = "doc",
    EXTERNAL = "external",
    CANCEL = "cancel",
    CANCEL_CIRCLE = "cancel-circle",
    CALENDAR = "calendar",
    COMMENT = "comment",
    MEGAPHONE = "megaphone",
    MAGIC = "magic",
    NOTIFICATION = "notification",
    EYE = "eye",
    ELLIPSIS = "ellipsis",
    OK = "ok",
    UP_OPEN = "up-open",
    DOWN_OPEN = "down-open",
    RIGHT_OPEN = "right-open",
    LEFT_OPEN = "left-open",
    RESIZE_FULL = "resize-full",
    RESIZE_SMALL = "resize-small",
    BLOCK = "block",
    OK_CIRCLED = "ok-circled",
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
    THUMBS_UP = "thumbs-up",
    THUMBS_DOWN = "thumbs-down",
    STAR = "star",
    LIGHT_BULB = "light-bulb",
    ENVELOPE_SEND = "envelope-send",
    REFRESH = "refresh",
    USER = "user",
    PLAY = "play",
    PENCIL = "pencil",
    PAUSE = "pause",
    CODE_BLOCK = "code-block",
    COPY = "copy",
    CURSOR_INSERT = "cursor-insert",
    TEXT_SELECT = "text-select",
    REVERT = "revert",
    ASTERISK = "asterisk"
}
export interface IconProps {
    icon: MynahIcons;
    classNames?: string[];
}
export declare class Icon {
    render: ExtendedHTMLElement;
    constructor(props: IconProps);
}
