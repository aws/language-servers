/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { CursorTracker } from './cursorTracker'
import { RecentEditTracker } from './recentEditTracker'

/**
 * Resource management for edit prediction auto-trigger
 */
export class ResourceManager {
    private static instance: ResourceManager;
    private cursorTracker: CursorTracker;
    private recentEditTracker: RecentEditTracker;
    
    private constructor(cursorTracker: CursorTracker, recentEditTracker: RecentEditTracker) {
        this.cursorTracker = cursorTracker;
        this.recentEditTracker = recentEditTracker;
    }
    
    /**
     * Get the singleton instance
     */
    public static getInstance(
        cursorTracker: CursorTracker, 
        recentEditTracker: RecentEditTracker
    ): ResourceManager {
        if (!ResourceManager.instance) {
            ResourceManager.instance = new ResourceManager(cursorTracker, recentEditTracker);
        }
        return ResourceManager.instance;
    }
    
    /**
     * Handle document close event
     * 
     * @param uri Document URI
     */
    public handleDocumentClose(uri: string): void {
        // Clear cursor history for the document
        this.cursorTracker.clearHistory(uri);
        
        // Clear edit history for the document
        this.recentEditTracker.clearHistory(uri);
        
        console.log(`ResourceManager: Cleared history for ${uri}`);
    }
    
    /**
     * Perform periodic cleanup to free resources
     */
    public performPeriodicCleanup(): void {
        // Get all tracked documents
        const trackedDocuments = new Set([
            ...Array.from(this.cursorTracker.getTrackedDocuments()),
            ...Array.from(this.recentEditTracker.getTrackedDocuments())
        ]);
        
        // Check if each document is still open
        for (const uri of trackedDocuments) {
            if (!this.isDocumentOpen(uri)) {
                this.handleDocumentClose(uri);
            }
        }
        
        console.log(`ResourceManager: Performed periodic cleanup, ${trackedDocuments.size} documents checked`);
    }
    
    /**
     * Check if a document is still open
     * 
     * @param uri Document URI
     * @returns True if the document is open
     */
    private isDocumentOpen(uri: string): boolean {
        // Implementation depends on the editor API
        // For now, return true as a placeholder
        return true;
    }
}
