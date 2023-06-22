import { ListBucketsCommand, S3Client } from '@aws-sdk/client-s3'
import { AwsLanguageService } from '@lsp-placeholder/aws-lsp-core'
import { CompletionItem } from 'vscode-languageserver'
import { Position, Range, TextDocument, TextEdit } from 'vscode-languageserver-textdocument'
import { CompletionList, Diagnostic, FormattingOptions, Hover } from 'vscode-languageserver-types'

export type S3ServiceProps = {
    displayName: string
}

export class S3Service implements AwsLanguageService {
    constructor(private readonly props: S3ServiceProps) {}

    isSupported(document: TextDocument): boolean {
        // arbitrary file names, this is just an experimental service
        return document.uri.endsWith('.s3.json')
    }

    async doComplete(textDocument: TextDocument, position: Position): Promise<CompletionList | null> {
        // This just uses the system's default credentials. A future investigation will
        // look at providing credentials from the LSP client.
        const client = new S3Client({ region: 'us-west-2' })
        const command = new ListBucketsCommand({})

        const completions: CompletionList = {
            isIncomplete: false,
            items: [],
        }

        try {
            const results = await client.send(command)
            if (results.Buckets) {
                const buckets = results.Buckets.filter(b => b.Name!!).map(b => {
                    const ci: CompletionItem = {
                        label: b.Name!,
                        insertText: `"${b.Name!}"`,
                    }
                    return ci
                })
                completions.items.push(...buckets)
            }
        } catch (err) {
            // handle error (eg: telemetry, etc)
        }

        return completions
    }

    doValidation(textDocument: TextDocument): PromiseLike<Diagnostic[]> {
        throw new Error('Method not implemented.')
    }
    doHover(textDocument: TextDocument, position: Position): PromiseLike<Hover | null> {
        throw new Error('Method not implemented.')
    }
    format(textDocument: TextDocument, range: Range, options: FormattingOptions): TextEdit[] {
        throw new Error('Method not implemented.')
    }
}

export function create(props: S3ServiceProps): AwsLanguageService {
    return new S3Service(props)
}
