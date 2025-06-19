import { FileCreate, FileRename, Logging, TextDocumentIdentifier } from '@aws/language-server-runtimes/server-interface'
import { WorkspaceFolderManager } from './workspaceFolderManager'
import { FileMetadata } from './artifactManager'
import { cleanUrl } from './util'

export enum FileUploadJobType {
    DID_SAVE_TEXT_DOCUMENT,
    DID_CREATE_FILE,
    DID_RENAME_FILE,
}

export interface FileUploadJob {
    eventType: FileUploadJobType
    fileMetadata: FileMetadata
    file: TextDocumentIdentifier | FileCreate | FileRename
}

export class FileUploadJobManager {
    private readonly logging: Logging
    private readonly workspaceFolderManager: WorkspaceFolderManager
    private readonly FILE_UPLOAD_JOB_PROCESS_INTERVAL: number = 100 // 100 milliseconds
    public jobQueue: FileUploadJob[] = []
    private jobConsumerInterval: NodeJS.Timeout | undefined
    private isJobConsumerWorking: boolean = false

    constructor(logging: Logging, workspaceFolderManager: WorkspaceFolderManager) {
        this.logging = logging
        this.workspaceFolderManager = workspaceFolderManager
    }

    public startFileUploadJobConsumer() {
        this.jobConsumerInterval = setInterval(async () => {
            if (this.isJobConsumerWorking) {
                return
            }
            this.isJobConsumerWorking = true
            try {
                const event = this.jobQueue.shift()
                if (!event) {
                    return
                }

                const worksapceState = this.workspaceFolderManager.getWorkspaceState()
                if (!worksapceState.workspaceId) {
                    // We can safely dispose any event when workspaceId is not set or gone, since
                    // workspaceFolderManager.continuousMonitorInterval will create a new snapshot
                    // later, which will guarantee the workspace state is re-calibrated
                    this.jobQueue = []
                    return
                }
                const workspaceId = worksapceState.workspaceId

                switch (event.eventType) {
                    case FileUploadJobType.DID_SAVE_TEXT_DOCUMENT:
                        await this.processDidSaveTextDocument(
                            workspaceId,
                            event.fileMetadata,
                            event.file as TextDocumentIdentifier
                        )
                        break
                    case FileUploadJobType.DID_CREATE_FILE:
                        await this.processDidCreateFile(workspaceId, event.fileMetadata, event.file as FileCreate)
                        break
                    case FileUploadJobType.DID_RENAME_FILE:
                        await this.processDidRenameFile(workspaceId, event.fileMetadata, event.file as FileRename)
                        break
                }
            } catch (err) {
                this.logging.error(`Error processing file upload event: ${err}`)
            } finally {
                this.isJobConsumerWorking = false
            }
        }, this.FILE_UPLOAD_JOB_PROCESS_INTERVAL)
    }

    private async processDidSaveTextDocument(
        workspaceId: string,
        fileMetadata: FileMetadata,
        textDocument: TextDocumentIdentifier
    ): Promise<void> {
        const s3Url = await this.workspaceFolderManager.uploadToS3(fileMetadata)
        if (!s3Url) {
            return
        }

        const message = JSON.stringify({
            method: 'textDocument/didSave',
            params: {
                textDocument: {
                    uri: textDocument.uri,
                },
                workspaceChangeMetadata: {
                    workspaceId: workspaceId,
                    s3Path: cleanUrl(s3Url),
                    programmingLanguage: fileMetadata.language,
                },
            },
        })
        this.workspaceFolderManager.getWorkspaceState().messageQueue.push(message)
    }

    private async processDidCreateFile(
        workspaceId: string,
        fileMetadata: FileMetadata,
        file: FileCreate
    ): Promise<void> {
        const s3Url = await this.workspaceFolderManager.uploadToS3(fileMetadata)
        if (!s3Url) {
            return
        }

        const message = JSON.stringify({
            method: 'workspace/didCreateFiles',
            params: {
                files: [
                    {
                        uri: file.uri,
                    },
                ],
                workspaceChangeMetadata: {
                    workspaceId: workspaceId,
                    s3Path: cleanUrl(s3Url),
                    programmingLanguage: fileMetadata.language,
                },
            },
        })
        this.workspaceFolderManager.getWorkspaceState().messageQueue.push(message)
    }

    private async processDidRenameFile(
        workspaceId: string,
        fileMetadata: FileMetadata,
        file: FileRename
    ): Promise<void> {
        const s3Url = await this.workspaceFolderManager.uploadToS3(fileMetadata)
        if (!s3Url) {
            return
        }

        const message = JSON.stringify({
            method: 'workspace/didRenameFiles',
            params: {
                files: [
                    {
                        old_uri: file.oldUri,
                        new_uri: file.newUri,
                    },
                ],
                workspaceChangeMetadata: {
                    workspaceId: workspaceId,
                    s3Path: cleanUrl(s3Url),
                    programmingLanguage: fileMetadata.language,
                },
            },
        })
        this.workspaceFolderManager.getWorkspaceState().messageQueue.push(message)
    }

    public dispose(): void {
        clearInterval(this.jobConsumerInterval)
    }
}
