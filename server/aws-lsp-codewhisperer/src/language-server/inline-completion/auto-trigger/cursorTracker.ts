/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { Position } from '@aws/language-server-runtimes/server-interface'

/**
 * Interface for cursor position with timestamp
 */
export interface CursorPosition {
    uri: string
    position: Position
    timestamp: number
}

/**
 * Tracks cursor positions over time to detect user pauses
 */
export class CursorTracker {
    private static readonly MAX_HISTORY_SIZE = 100
    private cursorHistory: Map<string, CursorPosition[]> = new Map()
    
    /**
     * Track a new cursor position
     * 
     * @param uri Document URI
     * @param position Cursor position
     * @returns The tracked position with timestamp
     */
    public trackPosition(uri: string, position: Position): CursorPosition {
        const cursorPosition: CursorPosition = {
            uri,
            position: { ...position },
            timestamp: Date.now()
        }
        
        // Initialize history array if it doesn't exist
        if (!this.cursorHistory.has(uri)) {
            this.cursorHistory.set(uri, [])
        }
        
        const history = this.cursorHistory.get(uri)!
        
        // Add new position to history
        history.push(cursorPosition)
        
        // Limit history size
        if (history.length > CursorTracker.MAX_HISTORY_SIZE) {
            history.shift()
        }
        
        return cursorPosition
    }
    
    /**
     * Get the last position timestamp for a document and position
     * 
     * @param uri Document URI
     * @param position Cursor position
     * @returns Timestamp of the last time the cursor was at this position, or undefined if not found
     */
    public getLastPositionTimestamp(uri: string, position: Position): number | undefined {
        const history = this.cursorHistory.get(uri)
        if (!history) {
            return undefined
        }
        
        // Find the last time the cursor was at this position
        for (let i = history.length - 1; i >= 0; i--) {
            const entry = history[i]
            if (this.isSamePosition(entry.position, position)) {
                return entry.timestamp
            }
        }
        
        return undefined
    }
    
    /**
     * Check if the cursor has been at the same position for the specified duration
     * 
     * @param uri Document URI
     * @param position Cursor position
     * @param durationMs Duration in milliseconds
     * @returns False if the cursor has been at the same position for less than the specified duration,
     *          True if the cursor has changed position or has been at the same position for at least the duration
     */
    public hasPositionChanged(uri: string, position: Position, durationMs: number): boolean {
        const lastTimestamp = this.getLastPositionTimestamp(uri, position)
        if (!lastTimestamp) {
            return true // Position not found in history, consider it changed
        }
        
        // Check if the cursor has been at this position for at least the specified duration
        const now = Date.now()
        const elapsedTime = now - lastTimestamp
        
        // Return true if the cursor has been at this position for at least the duration
        // Return false if the cursor has been at this position for less than the duration
        return elapsedTime >= durationMs
    }
    
    /**
     * Check if two positions are the same
     * 
     * @param pos1 First position
     * @param pos2 Second position
     * @returns True if the positions are the same
     */
    private isSamePosition(pos1: Position, pos2: Position): boolean {
        return pos1.line === pos2.line && pos1.character === pos2.character
    }
    
    /**
     * Clear history for a document
     * 
     * @param uri Document URI
     */
    public clearHistory(uri: string): void {
        this.cursorHistory.delete(uri)
    }
    
    /**
     * Get cursor history for a document
     * 
     * @param uri Document URI
     * @returns Cursor history for the document
     */
    public getHistory(uri: string): CursorPosition[] {
        return this.cursorHistory.get(uri) || []
    }
    
    /**
     * Get all tracked documents
     * 
     * @returns Array of document URIs
     */
    public getTrackedDocuments(): string[] {
        return Array.from(this.cursorHistory.keys())
    }
}
