/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const AllowedTags: readonly ["a", "audio", "b", "blockquote", "br", "hr", "canvas", "code", "col", "colgroup", "data", "div", "em", "embed", "figcaption", "figure", "h1", "h2", "h3", "h4", "h5", "h6", "i", "iframe", "img", "li", "map", "mark", "object", "ol", "p", "pre", "q", "s", "small", "source", "span", "strong", "sub", "sup", "table", "tbody", "td", "tfoot", "th", "thead", "tr", "track", "u", "ul", "video"];
export declare const AllowedAttributes: readonly ["accept", "accept-charset", "accesskey", "align", "allow", "allowfullscreen", "alt", "as", "async", "autocapitalize", "autoplay", "charset", "class", "cols", "colspan", "controls", "crossorigin", "data", "data-*", "datetime", "decoding", "default", "dir", "download", "headers", "hidden", "high", "href", "hreflang", "id", "ismap", "itemprop", "kind", "lang", "language", "loop", "low", "media", "muted", "optimum", "ping", "playsinline", "poster", "preload", "referrerpolicy", "rel", "reversed", "role", "rowspan", "sandbox", "scope", "shape", "size", "sizes", "slot", "span", "spellcheck", "src", "srcdoc", "srclang", "srcset", "start", "style", "target", "title", "translate", "usemap", "wrap", "aspect-ratio"];
export type AllowedTagsInCustomRenderer = (typeof AllowedTags)[number];
export type AllowedAttributesInCustomRenderer = (typeof AllowedAttributes)[number];
export declare const cleanHtml: (dirty: string) => string;
