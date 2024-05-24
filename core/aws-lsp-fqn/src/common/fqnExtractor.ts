import type * as Fqn from '@aws/fully-qualified-names'
import { FqnExtractorInput, FqnExtractorOutput } from './types'

function extractNames(
    fqn: typeof Fqn,
    languageId: FqnExtractorInput['languageId'],
    fileText: string,
    extent: Fqn.Extent
): Promise<FqnExtractorOutput> {
    switch (languageId) {
        case 'java':
            return fqn.Java.findNamesWithInExtent(fileText, extent)
        case 'javascriptreact':
        case 'typescriptreact':
            return fqn.Tsx.findNamesWithInExtent(fileText, extent)
        case 'javascript':
        case 'typescript':
            return fqn.TypeScript.findNamesWithInExtent(fileText, extent)
        case 'python':
            return fqn.Python.findNamesWithInExtent(fileText, extent)
        default:
            // ideally unreachable
            throw new Error(`Unsupported language: ${languageId}`)
    }
}

export async function extract(fqn: typeof Fqn, input: FqnExtractorInput): Promise<FqnExtractorOutput> {
    const { fileText, languageId, selection } = input

    const startLocation = new fqn.Location(selection.start.line, selection.start.character)
    const endLocation = new fqn.Location(selection.end.line, selection.end.character)
    const extent = new fqn.Extent(startLocation, endLocation)

    return extractNames(fqn, languageId, fileText, extent)
}
