import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { InvokeOutput } from './toolShared'

export type LspReadDocumentContentsParams = {
    uris: string[]
    readRange?: number[]
}

export class LspReadDocumentContents {
    private readonly logging: Features['logging']
    private readonly workspace: Features['workspace']

    constructor(features: Pick<Features, 'workspace' | 'logging'> & Partial<Features>) {
        this.logging = features.logging
        this.workspace = features.workspace
    }

    public async invoke(params: LspReadDocumentContentsParams): Promise<InvokeOutput> {
        if (params.uris.length === 0) {
            return {
                output: {
                    kind: 'text',
                    content: 'No URIs provided to read.',
                },
            }
        }

        try {
            const results: { [uri: string]: string } = {}

            for (const uri of params.uris) {
                const document = await this.workspace.getTextDocument(uri)

                if (!document) {
                    this.logging.warn(`Document not found: ${uri}`)
                    results[uri] = `[Document not found: ${uri}]`
                    continue
                }

                const content = document.getText()

                if (params.readRange && params.readRange.length > 0) {
                    const lines = content.split('\n')
                    const [start, end] = this.parseLineRange(lines.length, params.readRange)

                    if (start > end) {
                        results[uri] = `[Invalid range for ${uri}: ${params.readRange.join('-')}]`
                    } else {
                        results[uri] = lines.slice(start, end + 1).join('\n')
                    }
                } else {
                    results[uri] = content
                }
            }

            // If only one URI was requested, return just its content
            if (params.uris.length === 1) {
                return {
                    output: {
                        kind: 'text',
                        content: results[params.uris[0]],
                    },
                }
            }

            // Otherwise return a JSON object with all results
            return {
                output: {
                    kind: 'json',
                    content: results,
                },
            }
        } catch (error) {
            this.logging.error(`Error reading document contents: ${error}`)
            return {
                output: {
                    kind: 'text',
                    content: `Error reading document contents: ${error}`,
                },
            }
        }
    }

    private parseLineRange(lineCount: number, range: number[]): [number, number] {
        const startIdx = range[0]
        let endIdx = range.length >= 2 ? range[1] : undefined

        if (endIdx === undefined) {
            endIdx = -1
        }

        const convert = (i: number): number => {
            return i < 0 ? lineCount + i : i - 1
        }

        const finalStart = Math.max(0, Math.min(lineCount - 1, convert(startIdx)))
        const finalEnd = Math.max(0, Math.min(lineCount - 1, convert(endIdx)))
        return [finalStart, finalEnd]
    }

    public static getSpec() {
        return {
            name: 'lspReadDocumentContents',
            description:
                'Read the contents of one or more documents that are currently open in the editor. ' +
                'This tool is useful for accessing the content of files the user is currently working on, ' +
                'including unsaved changes.',
            inputSchema: {
                type: 'object',
                properties: {
                    uris: {
                        type: 'array',
                        items: {
                            type: 'string',
                        },
                        description:
                            'URI or list of URIs of documents to read. Use lspGetDocuments tool first to discover available documents.',
                    },
                    readRange: {
                        description:
                            'Optional parameter when reading documents.\n * If none is given, the full document is returned. ' +
                            'If provided, the document will be shown in the indicated line number range, e.g. [11, 12] will show lines 11 and 12. ' +
                            'Indexing at 1 to start. Setting `[startLine, -1]` shows all lines from `startLine` to the end of the document.',
                        type: 'array',
                        items: {
                            type: 'number',
                        },
                    },
                },
                required: ['uris'],
            } as const,
        }
    }
}
