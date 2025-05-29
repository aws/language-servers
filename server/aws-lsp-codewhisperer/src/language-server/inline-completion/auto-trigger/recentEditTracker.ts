/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { Range, TextDocumentContentChangeEvent } from '@aws/language-server-runtimes/server-interface'

/**
 * Interface for a document edit
 */
export interface DocumentEdit {
    uri: string;
    range: Range;
    text: string;
    timestamp: number;
}

/**
 * Enhanced RecentEditTracker to support edit prediction auto-trigger
 */
export class RecentEditTracker {
    private static readonly MAX_EDIT_HISTORY = 100;
    private static readonly EDIT_HISTORY_DURATION_MS = 300000; // 5 minutes
    
    private editHistory: Map<string, DocumentEdit[]> = new Map();
    
    /**
     * Track a document change
     * 
     * @param uri Document URI
     * @param change Text document content change event
     */
    public trackEdit(uri: string, change: TextDocumentContentChangeEvent): void {
        // Handle both types of TextDocumentContentChangeEvent
        const range = 'range' in change ? change.range : undefined;
        
        if (!range) {
            // If no range is provided, we can't track this edit precisely
            // This happens with full document updates
            return;
        }
        
        const edit: DocumentEdit = {
            uri,
            range,
            text: change.text,
            timestamp: Date.now()
        };
        
        // Initialize history array if it doesn't exist
        if (!this.editHistory.has(uri)) {
            this.editHistory.set(uri, []);
        }
        
        const history = this.editHistory.get(uri)!;
        
        // Add new edit to history
        history.push(edit);
        
        // Limit history size
        if (history.length > RecentEditTracker.MAX_EDIT_HISTORY) {
            history.shift();
        }
        
        // Clean up old edits
        this.cleanupOldEdits(uri);
    }
    
    /**
     * Clean up edits older than the history duration
     * 
     * @param uri Document URI
     */
    private cleanupOldEdits(uri: string): void {
        const history = this.editHistory.get(uri);
        if (!history) {
            return;
        }
        
        const now = Date.now();
        const cutoffTime = now - RecentEditTracker.EDIT_HISTORY_DURATION_MS;
        
        // Remove edits older than the cutoff time
        const newHistory = history.filter(edit => edit.timestamp >= cutoffTime);
        this.editHistory.set(uri, newHistory);
    }
    
    /**
     * Check if there has been a recent edit in the specified line
     * 
     * @param uri Document URI
     * @param lineNum Line number
     * @param timeThresholdMs Time threshold in milliseconds
     * @returns True if there has been an edit in the line within the time threshold
     */
    public hasRecentEditInLine(uri: string, lineNum: number, timeThresholdMs: number): boolean {
        const history = this.editHistory.get(uri);
        if (!history) {
            return false;
        }
        
        const now = Date.now();
        const cutoffTime = now - timeThresholdMs;
        
        // Check if there's been an edit in the line within the time threshold
        return history.some(edit => {
            // Check if the edit affects the specified line
            const startLine = edit.range.start.line;
            const endLine = edit.range.end.line;
            const affectsLine = lineNum >= startLine && lineNum <= endLine;
            
            // Check if the edit is recent enough
            const isRecent = edit.timestamp >= cutoffTime;
            
            return affectsLine && isRecent;
        });
    }
    
    /**
     * Get recent edits for a document
     * 
     * @param uri Document URI
     * @returns Recent edits for the document
     */
    public getRecentEdits(uri: string): DocumentEdit[] {
        return this.editHistory.get(uri) || [];
    }
    
    /**
     * Clear history for a document
     * 
     * @param uri Document URI
     */
    public clearHistory(uri: string): void {
        this.editHistory.delete(uri);
    }
    
    /**
     * Get all tracked documents
     * 
     * @returns Array of document URIs
     */
    public getTrackedDocuments(): string[] {
        return Array.from(this.editHistory.keys());
    }
}
