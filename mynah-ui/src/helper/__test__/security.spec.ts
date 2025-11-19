/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { cleanHtml, escapeHtml } from '../sanitize';
import { DomBuilder } from '../dom';

describe('Security - XSS Prevention', () => {
    let domBuilder: DomBuilder;

    beforeEach(() => {
        domBuilder = DomBuilder.getInstance();
        document.body.innerHTML = '';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('cleanHtml', () => {
        it('should remove script tags', () => {
            const malicious = '<script>alert("XSS")</script><p>Safe content</p>';
            const sanitized = cleanHtml(malicious);

            expect(sanitized).not.toContain('<script>');
            expect(sanitized).not.toContain('alert');
            expect(sanitized).toContain('<p>Safe content</p>');
        });

        it('should remove event handlers', () => {
            const malicious = '<img src=x onerror=alert("XSS")><div onclick="malicious()">Click me</div>';
            const sanitized = cleanHtml(malicious);

            expect(sanitized).not.toContain('onerror');
            expect(sanitized).not.toContain('onclick');
            expect(sanitized).not.toContain('alert');
            expect(sanitized).not.toContain('malicious');
        });

        it('should remove javascript: URLs', () => {
            const malicious = '<a href="javascript:alert(\'XSS\')">Click me</a>';
            const sanitized = cleanHtml(malicious);

            expect(sanitized).not.toContain('javascript:');
            expect(sanitized).not.toContain('alert');
        });

        it('should preserve safe HTML', () => {
            const safe = '<p><strong>Bold text</strong> and <em>italic text</em></p>';
            const sanitized = cleanHtml(safe);

            expect(sanitized).toContain('<p>');
            expect(sanitized).toContain('<strong>');
            expect(sanitized).toContain('<em>');
            expect(sanitized).toContain('Bold text');
            expect(sanitized).toContain('italic text');
        });

        it('should handle complex XSS payloads', () => {
            const malicious = '"><img src=x onerror=prompt(document.domain)>';
            const sanitized = cleanHtml(malicious);

            expect(sanitized).not.toContain('onerror');
            expect(sanitized).not.toContain('prompt');
            expect(sanitized).not.toContain('document.domain');
        });

        it('should sanitize HTML injection', () => {
            const malicious = '<h1>Hello Security Team</h1><script>alert("XSS")</script>';
            const sanitized = cleanHtml(malicious);

            expect(sanitized).toContain('<h1>Hello Security Team</h1>');
            expect(sanitized).not.toContain('<script>');
            expect(sanitized).not.toContain('alert');
        });
    });

    describe('escapeHtml', () => {
        it('should escape HTML characters', () => {
            const unsafe = '<script>alert("XSS")</script>';
            const escaped = escapeHtml(unsafe);

            expect(escaped).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
        });

        it('should escape all dangerous characters', () => {
            const unsafe = '& < > " \' /';
            const escaped = escapeHtml(unsafe);

            expect(escaped).toBe('&amp; &lt; &gt; &quot; &#x27; &#x2F;');
        });
    });

    describe('DOM Builder Security', () => {
        it('should sanitize innerHTML in build method', () => {
            const maliciousContent = '<script>alert("XSS")</script><p>Safe content</p>';

            const element = domBuilder.build({
                type: 'div',
                innerHTML: maliciousContent,
            });

            expect(element.innerHTML).not.toContain('<script>');
            expect(element.innerHTML).not.toContain('alert');
            expect(element.innerHTML).toContain('<p>Safe content</p>');
        });

        it('should sanitize innerHTML in update method', () => {
            const initialElement = domBuilder.build({
                type: 'div',
                innerHTML: '<p>Initial content</p>',
            });

            const maliciousContent = '<script>alert("XSS")</script><p>Updated content</p>';

            const updatedElement = domBuilder.update(initialElement, {
                innerHTML: maliciousContent,
            });

            expect(updatedElement.innerHTML).not.toContain('<script>');
            expect(updatedElement.innerHTML).not.toContain('alert');
            expect(updatedElement.innerHTML).toContain('<p>Updated content</p>');
        });

        it('should prevent XSS through complex payloads', () => {
            const xssPayloads = [
                '"><img src=x onerror=prompt(document.domain)>',
                '<svg onload=alert("XSS")>',
                '<iframe src="javascript:alert(\'XSS\')"></iframe>',
                '<object data="javascript:alert(\'XSS\')"></object>',
                '<embed src="javascript:alert(\'XSS\')">',
                '<form><input type="text" onfocus="alert(\'XSS\')" autofocus>',
                '<details open ontoggle="alert(\'XSS\')">',
                '<marquee onstart="alert(\'XSS\')">',
            ];

            xssPayloads.forEach((payload, index) => {
                const element = domBuilder.build({
                    type: 'div',
                    innerHTML: payload,
                });

                // These dangerous elements should be completely removed
                expect(element.innerHTML).not.toContain('alert');
                expect(element.innerHTML).not.toContain('prompt');
                expect(element.innerHTML).not.toContain('javascript:');
                expect(element.innerHTML).not.toContain('onerror');
                expect(element.innerHTML).not.toContain('onload');
                expect(element.innerHTML).not.toContain('onfocus');
                expect(element.innerHTML).not.toContain('ontoggle');
                expect(element.innerHTML).not.toContain('onstart');
                expect(element.innerHTML).not.toContain('<iframe');
                expect(element.innerHTML).not.toContain('<object');
                expect(element.innerHTML).not.toContain('<embed');
                expect(element.innerHTML).not.toContain('<svg');
                expect(element.innerHTML).not.toContain('<form');
                expect(element.innerHTML).not.toContain('<details');
                expect(element.innerHTML).not.toContain('<marquee');
            });
        });
    });

    describe('Real-world XSS scenarios', () => {
        it('should handle user input in chat messages', () => {
            const userMessage = '"><img src=x onerror=prompt(document.domain)>';

            const chatElement = domBuilder.build({
                type: 'div',
                classNames: ['mynah-chat-message'],
                innerHTML: userMessage,
            });

            expect(chatElement.innerHTML).not.toContain('onerror');
            expect(chatElement.innerHTML).not.toContain('prompt');
            expect(chatElement.innerHTML).not.toContain('document.domain');
        });

        it('should handle malicious markdown content', () => {
            const maliciousMarkdown = '[Click me](javascript:alert("XSS"))<script>alert("XSS")</script>';

            const element = domBuilder.build({
                type: 'div',
                innerHTML: maliciousMarkdown,
            });

            // The content should be treated as plain text, not parsed as markdown
            expect(element.innerHTML).not.toContain('<script>');
            // Since this is plain text, it will contain the literal string "alert" but not execute
            // The important thing is that <script> tags are removed
            expect(element.innerHTML).toContain('[Click me]');
        });

        it('should handle XSS in custom renderer content', () => {
            const maliciousCustomContent = '<h1>Title</h1><script>alert("XSS")</script>';

            const element = domBuilder.build({
                type: 'div',
                innerHTML: maliciousCustomContent,
            });

            expect(element.innerHTML).toContain('<h1>Title</h1>');
            expect(element.innerHTML).not.toContain('<script>');
            expect(element.innerHTML).not.toContain('alert');
        });
    });
});
