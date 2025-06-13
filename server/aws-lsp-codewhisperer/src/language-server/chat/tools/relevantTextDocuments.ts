import { RelevantTextDocument } from '@aws/codewhisperer-streaming-client'
import { Chunk } from 'local-indexing'

export function convertChunksToRelevantTextDocuments(chunks: Chunk[]): RelevantTextDocument[] {
    const filePathSizeLimit = 4_000

    const groupedChunks = chunks.reduce(
        (acc, chunk) => {
            const key = chunk.filePath
            if (!acc[key]) {
                acc[key] = []
            }
            acc[key].push(chunk)
            return acc
        },
        {} as Record<string, Chunk[]>
    )

    return Object.entries(groupedChunks).map(([filePath, fileChunks]) => {
        fileChunks.sort((a, b) => {
            if (a.startLine !== undefined && b.startLine !== undefined) {
                return a.startLine - b.startLine
            }
            return 0
        })

        const firstChunk = fileChunks[0]

        let programmingLanguage
        if (firstChunk.programmingLanguage && firstChunk.programmingLanguage !== 'unknown') {
            programmingLanguage = {
                languageName: firstChunk.programmingLanguage,
            }
        }

        const combinedContent = fileChunks
            .map(chunk => chunk.content)
            .filter(content => content !== undefined && content !== '')
            .join('\n')

        const relevantTextDocument: RelevantTextDocument = {
            relativeFilePath: firstChunk.relativePath
                ? firstChunk.relativePath.substring(0, filePathSizeLimit)
                : undefined,
            programmingLanguage,
            text: combinedContent || undefined,
        }

        return Object.fromEntries(
            Object.entries(relevantTextDocument).filter(([_, value]) => value !== undefined)
        ) as RelevantTextDocument
    })
}
