import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { InvokeOutput } from './toolShared'

export type LspGetDocumentsParams = {
    filter?: string
}

export class LspGetDocuments {
    private readonly logging: Features['logging']
    private readonly workspace: Features['workspace']

    constructor(features: Pick<Features, 'workspace' | 'logging'> & Partial<Features>) {
        this.logging = features.logging
        this.workspace = features.workspace
    }

    public async invoke(params: LspGetDocumentsParams): Promise<InvokeOutput> {
        return this.workspace.getAllTextDocuments().then(documents => {
            const filteredDocuments = documents.filter(document => {
                if (params.filter) {
                    return document.uri.toLowerCase().includes(params.filter.toLowerCase())
                }
                return true
            })
            const documentNames = filteredDocuments.map(document => document.uri)
            return {
                output: {
                    kind: 'text',
                    content: documentNames.join('\n'),
                },
            }
        })
    }

    public static getSpec() {
        return {
            name: 'lspGetDocuments',
            description:
                'Use the LSP document synchronization to read a list of all open documents in the current workspace',
            inputSchema: {
                type: 'object',
                properties: {
                    filter: {
                        type: 'string',
                        description:
                            'An optional case-insensitive string to filter on. Does not support wildcards, so only exact substrings match.',
                    },
                },
            } as const,
        }
    }
}
