# Custom File Modification UI Integration

This document explains how to integrate your own UI component with the AgenticChatController to receive file modification events.

## Overview

The AgenticChatController now supports forwarding file modification data to a custom UI component alongside the existing mynah-ui integration. This allows you to:

- Track file modifications in real-time
- Handle undo operations
- Display file changes in your custom UI
- Respond to error states

## Key Integration Points

### 1. File Modification Events

When files are modified via `FS_WRITE` or `FS_REPLACE` tools, the controller forwards:

```typescript
interface FileModificationData {
    toolUseId: string           // Unique identifier for the tool use
    filePath: string           // Full path to the modified file
    fileName: string           // Just the filename
    changes: {                 // Line change statistics
        added: number
        deleted: number
    }
    beforeContent: string      // File content before modification
    afterContent: string       // File content after modification
    undoAvailable: boolean     // Whether undo is available
    relatedToolUses?: Set<string>  // Related tool uses for undo-all
    status: 'modified' | 'undone' | 'error'  // Current status
    timestamp: number          // When the event occurred
}
```

### 2. Event Types

The custom UI receives these events:

- **`onFileModified`**: When a file is successfully modified
- **`onFileUndone`**: When a single file modification is undone
- **`onAllFilesUndone`**: When multiple related file modifications are undone together
- **`onFileError`**: When a file modification fails

## Implementation

### Step 1: Implement the Interface

Create your custom UI class implementing `CustomFileModificationUI`:

```typescript
import { CustomFileModificationUI, FileModificationData } from './customFileModificationUI'

export class MyCustomFileModificationUI implements CustomFileModificationUI {
    async onFileModified(tabId: string, data: FileModificationData): Promise<void> {
        // Your implementation here
        // Example: Update your UI state, send to WebSocket, etc.
    }

    async onFileUndone(tabId: string, toolUseId: string): Promise<void> {
        // Handle undo events
    }

    async onAllFilesUndone(tabId: string, relatedToolUses: Set<string>): Promise<void> {
        // Handle undo-all events
    }

    async onFileError(tabId: string, toolUseId: string, error: string): Promise<void> {
        // Handle error events
    }
}
```

### Step 2: Integrate with the Server

Modify `qAgenticChatServer.ts` to use your custom UI:

```typescript
// Replace the createCustomFileModificationUI() call
const customFileModificationUI = new MyCustomFileModificationUI()

chatController = new AgenticChatController(
    chatSessionManagementService,
    features,
    telemetryService,
    amazonQServiceManager,
    customFileModificationUI  // Pass your implementation here
)
```

### Step 3: Handle Events in Your UI

Your custom UI will receive events at these key moments:

1. **File Modified**: Right after a file is successfully written/replaced
2. **File Undone**: When user clicks "Undo" button for a specific file
3. **All Files Undone**: When user clicks "Undo all changes" button
4. **File Error**: When a file operation fails

## Data Flow

```
AgenticChatController
    ↓ (file modification)
#getFsWriteChatResult → #forwardFileModificationToCustomUI
    ↓
Your Custom UI Component

AgenticChatController
    ↓ (undo action)
onButtonClick → #forwardFileUndoToCustomUI
    ↓
Your Custom UI Component
```

## Example Use Cases

### 1. Real-time File Change Dashboard

```typescript
export class FileChangeDashboardUI implements CustomFileModificationUI {
    private dashboard: Dashboard

    async onFileModified(tabId: string, data: FileModificationData): Promise<void> {
        this.dashboard.addFileChange({
            id: data.toolUseId,
            file: data.fileName,
            path: data.filePath,
            additions: data.changes.added,
            deletions: data.changes.deleted,
            timestamp: data.timestamp,
            canUndo: data.undoAvailable
        })
    }

    // ... other methods
}
```

### 2. WebSocket Integration

```typescript
export class WebSocketFileModificationUI implements CustomFileModificationUI {
    constructor(private websocket: WebSocket) {}

    async onFileModified(tabId: string, data: FileModificationData): Promise<void> {
        this.websocket.send(JSON.stringify({
            type: 'file-modified',
            tabId,
            data: {
                toolUseId: data.toolUseId,
                fileName: data.fileName,
                filePath: data.filePath,
                changes: data.changes,
                timestamp: data.timestamp
            }
        }))
    }

    // ... other methods
}
```

### 3. Database Integration

```typescript
export class DatabaseFileModificationUI implements CustomFileModificationUI {
    constructor(private db: Database) {}

    async onFileModified(tabId: string, data: FileModificationData): Promise<void> {
        await this.db.insertFileModification({
            tool_use_id: data.toolUseId,
            tab_id: tabId,
            file_name: data.fileName,
            file_path: data.filePath,
            lines_added: data.changes.added,
            lines_deleted: data.changes.deleted,
            status: data.status,
            created_at: new Date(data.timestamp)
        })
    }

    // ... other methods
}
```

## Modified Files Tracker Integration

The `examples/modifiedFilesTrackerIntegration.ts` file shows how to integrate with the existing mynah-ui `ModifiedFilesTracker` component:

```typescript
import { ModifiedFilesTrackerUI } from './examples/modifiedFilesTrackerIntegration'

// Create the tracker integration
const trackerUI = new ModifiedFilesTrackerUI()

// Pass it to the AgenticChatController
const chatController = new AgenticChatController(
    chatSessionManagementService,
    features,
    telemetryService,
    amazonQServiceManager,
    trackerUI  // Your tracker integration
)

// Access the tracker components for each tab
const tracker = trackerUI.getTracker('tab-id')
if (tracker) {
    // The tracker component is ready to be rendered in your UI
    document.getElementById('modified-files-container')?.appendChild(tracker.render)
}
```

This integration:
- Automatically updates the modified files tracker when files are changed
- Handles undo operations for individual files and all files
- Provides proper status indicators (modified, error, undone)
- Maintains file counts and visibility state
- Forwards button clicks back to the AgenticChatController

## Testing

The implementation includes a `ConsoleFileModificationUI` that logs all events to the console for testing purposes. You can use this to verify that events are being forwarded correctly before implementing your own UI.

## Notes

- The custom UI integration is completely independent of mynah-ui
- All existing mynah-ui functionality continues to work unchanged
- The custom UI receives the same processed data that mynah-ui receives
- Error handling is built-in - if your custom UI throws errors, they won't break the main chat functionality
- The integration is optional - if no custom UI is provided, the controller works exactly as before