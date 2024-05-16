import { parentPort, workerData } from 'worker_threads'
import { extract } from '../common/fqnExtractor'
import { FqnExtractorInput } from '../common/types'

async function start() {
    try {
        const symbolExtractorInput: FqnExtractorInput = workerData.input
        console.log(`Extracting fully qualified names for ${symbolExtractorInput.languageId}`)

        const data = await extract(symbolExtractorInput)

        parentPort?.postMessage({ data, success: true })
    } catch (e) {
        console.error(`Failed to extract fully qualified names: ${e instanceof Error ? e.message : 'unknown'}`)
        parentPort?.postMessage({ success: false, error: e instanceof Error ? e.message : 'unknown' })
    }

    process.exit(0)
}

start()
