import { ListBucketsCommand, S3Client } from '@aws-sdk/client-s3'
import { AwsCredentialIdentity, AwsCredentialIdentityProvider } from '@aws-sdk/types'
import { AwsLanguageService, CredentialsProvider } from '@lsp-placeholder/aws-lsp-core'
import { CancellationToken, CompletionItem } from 'vscode-languageserver'
import { Position, Range, TextDocument, TextEdit } from 'vscode-languageserver-textdocument'
import { CompletionList, Diagnostic, FormattingOptions, Hover } from 'vscode-languageserver-types'

export type S3ServiceProps = {
    displayName: string
    credentialsProvider: CredentialsProvider
}

export class S3Service implements AwsLanguageService {
    constructor(private readonly props: S3ServiceProps) {}

    isSupported(document: TextDocument): boolean {
        // arbitrary file names, this is just an experimental service
        return document.uri.endsWith('.s3.json')
    }

    async doComplete(textDocument: TextDocument, position: Position): Promise<CompletionList | null> {
        const completions: CompletionList = {
            isIncomplete: false,
            items: [],
        }

        const client = this.createS3Client()

        const command = new ListBucketsCommand({})

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

        return completions
    }

    private createS3Client(): S3Client {
        return new S3Client({
            // TODO : Will we need the host to provide the region?
            region: 'us-west-2',
            credentials: this.getIamCredentialsResolver(),
        })
    }

    /**
     * AWS SDK service client delegate that produces IAM Credentials
     */
    private getIamCredentialsResolver(): AwsCredentialIdentityProvider {
        const credentialsProvider = this.props.credentialsProvider

        /**
         * Requests IAM Credentials from the host, through an abstraction
         */
        async function getIamCredentials(): Promise<AwsCredentialIdentity> {
            const response = await credentialsProvider.resolveIamCredentials(CancellationToken.None)

            return {
                accessKeyId: response.accessKeyId,
                secretAccessKey: response.secretAccessKey,
                sessionToken: response.sessionToken,
            }
        }

        return getIamCredentials
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
