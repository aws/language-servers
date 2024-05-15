import { Extent, Java, Location, Python, Tsx } from '@aws/fully-qualified-names'
import { FqnExtractorInput, FqnExtractorOutput } from './types'

function extractNames(
    languageId: FqnExtractorInput['languageId'],
    fileText: string,
    extent: Extent
): Promise<FqnExtractorOutput> {
    switch (languageId) {
        case 'java':
            return Java.findNamesWithInExtent(fileText, extent)
        case 'javascriptreact':
        case 'typescriptreact':
            return Tsx.findNamesWithInExtent(fileText, extent)
        case 'javascript':
        case 'typescript':
            return Tsx.findNamesWithInExtent(fileText, extent)
        case 'python':
            return Python.findNamesWithInExtent(fileText, extent)
        default:
            // ideally unreachable
            throw new Error(`Unsupported language: ${languageId}`)
    }
}

export async function extract(input: FqnExtractorInput): Promise<FqnExtractorOutput> {
    const { fileText, languageId, selection } = input

    const startLocation = new Location(selection.start.line, selection.start.character)
    const endLocation = new Location(selection.end.line, selection.end.character)
    const extent = new Extent(startLocation, endLocation)

    return extractNames(languageId, fileText, extent)
}
