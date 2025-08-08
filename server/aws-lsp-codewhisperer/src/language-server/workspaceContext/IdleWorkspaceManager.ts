import { WorkspaceFolderManager } from './workspaceFolderManager'

export class IdleWorkspaceManager {
    private static readonly idleThreshold = 30 * 60 * 1000 // 30 minutes
    private static lastActivityTimestamp = 0 // treat session as idle as the start

    private constructor() {}

    /**
     * Records activity timestamp and triggers workspace status check if session was idle.
     *
     * When transitioning from idle to active, proactively checks remote workspace status
     * (if continuous monitoring is enabled) without blocking the current operation.
     */
    public static recordActivityTimestamp(): void {
        try {
            const wasSessionIdle = IdleWorkspaceManager.isSessionIdle()
            IdleWorkspaceManager.lastActivityTimestamp = Date.now()

            const workspaceFolderManager = WorkspaceFolderManager.getInstance()
            if (workspaceFolderManager && wasSessionIdle && !workspaceFolderManager.isContinuousMonitoringStopped()) {
                // Proactively check the remote workspace status instead of waiting for the next scheduled check
                // Fire and forget - don't await to avoid blocking
                workspaceFolderManager.checkRemoteWorkspaceStatusAndReact().catch(err => {
                    // ignore errors
                })
            }
        } catch (err) {
            // ignore errors
        }
    }

    public static isSessionIdle(): boolean {
        const currentTime = Date.now()
        const timeSinceLastActivity = currentTime - IdleWorkspaceManager.lastActivityTimestamp
        return timeSinceLastActivity > IdleWorkspaceManager.idleThreshold
    }
}
