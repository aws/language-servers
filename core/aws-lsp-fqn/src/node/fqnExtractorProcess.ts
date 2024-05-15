import { extract } from '../common/fqnExtractor'
import { FqnExtractorInput } from '../common/types'
;(async function () {
    try {
        const symbolExtractorInput: FqnExtractorInput = JSON.parse(process.argv[2])
        process.stdout.write(`Extracting fully qualified names for ${symbolExtractorInput.languageId}`)

        const data = await extract(symbolExtractorInput)

        process.send?.({ data, success: true })
    } catch (e) {
        process.stderr.write(`Failed to extract fully qualified names: ${e instanceof Error ? e.message : 'unknown'}`)
        process.send?.({ success: false, error: e instanceof Error ? e.message : 'unknown' })
    }

    process.exit(0)
})()
