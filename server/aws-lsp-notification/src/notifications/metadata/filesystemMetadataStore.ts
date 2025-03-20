import path from 'path'
import { Metadata, MetadataStore } from './metadataStore'
import { Workspace } from '@aws/language-server-runtimes/server-interface'

export class FilesystemMetadataStore implements MetadataStore {
    private readonly metadataFilePath: string

    constructor(
        private readonly workspace: Workspace,
        dataDirPath: string
    ) {
        this.metadataFilePath = path.join(dataDirPath, 'metadata.json')
    }

    async load(): Promise<Metadata> {
        // TODO What happens if server path doesn't exist?
        // TODO Handle case where file does not exist
        const metadataFile = await this.workspace.fs.readFile(this.metadataFilePath)
        return JSON.parse(metadataFile)
    }

    async save(metadata: Metadata): Promise<void> {
        await this.workspace.fs.writeFile(this.metadataFilePath, JSON.stringify(metadata))
    }
}
