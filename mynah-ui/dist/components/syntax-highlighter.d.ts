/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ExtendedHTMLElement } from '../helper/dom';
import 'prismjs/components/prism-markup.min';
import 'prismjs/components/prism-xml-doc.min';
import 'prismjs/components/prism-css.min';
import 'prismjs/components/prism-clike.min';
import 'prismjs/components/prism-javascript.min';
import 'prismjs/components/prism-typescript.min';
import 'prismjs/components/prism-jsx.min';
import 'prismjs/components/prism-diff.min';
import 'prismjs/components/prism-tsx.min';
import 'prismjs/components/prism-lua.min';
import 'prismjs/components/prism-java.min';
import 'prismjs/components/prism-json.min';
import 'prismjs/components/prism-markdown.min';
import 'prismjs/components/prism-mongodb.min';
import 'prismjs/components/prism-c.min';
import 'prismjs/components/prism-bash.min';
import 'prismjs/components/prism-csharp.min';
import 'prismjs/components/prism-objectivec.min';
import 'prismjs/components/prism-python.min';
import 'prismjs/components/prism-regex.min';
import 'prismjs/components/prism-scala.min';
import 'prismjs/components/prism-scss.min';
import 'prismjs/components/prism-less.min';
import 'prismjs/plugins/line-numbers/prism-line-numbers.js';
import 'prismjs/plugins/keep-markup/prism-keep-markup.js';
import 'prismjs/plugins/diff-highlight/prism-diff-highlight.min';
import { CodeBlockActions, CodeSelectionType, OnCodeBlockActionFunction } from '../static';
import '../styles/components/_syntax-highlighter.scss';
export declare const highlighters: {
    start: {
        markup: string;
        textReplacement: string;
    };
    end: {
        markup: string;
        textReplacement: string;
    };
};
export declare const ellipsis: {
    start: {
        markup: string;
        textReplacement: string;
    };
    end: {
        markup: string;
        textReplacement: string;
    };
};
export interface SyntaxHighlighterProps {
    codeStringWithMarkup: string;
    language?: string;
    keepHighlights?: boolean;
    showLineNumbers?: boolean;
    block?: boolean;
    startingLineNumber?: number;
    index?: number;
    codeBlockActions?: CodeBlockActions;
    onCopiedToClipboard?: (type?: CodeSelectionType, text?: string, codeBlockIndex?: number) => void;
    onCodeBlockAction?: OnCodeBlockActionFunction;
}
export declare class SyntaxHighlighter {
    private readonly props?;
    private readonly codeBlockButtons;
    render: ExtendedHTMLElement;
    constructor(props: SyntaxHighlighterProps);
    private readonly getSelectedCodeContextMenu;
    private readonly getSelectedCode;
    private readonly onCopiedToClipboard;
}
