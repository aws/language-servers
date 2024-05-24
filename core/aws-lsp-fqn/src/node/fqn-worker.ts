import * as fqn from '@aws/fully-qualified-names'
import { worker } from 'workerpool'
import { FQN_WORKER_ID } from '../common/defaults'
import { extract } from '../common/fqnExtractor'
import { FqnExtractorInput } from '../common/types'

async function fqnWorker(input: FqnExtractorInput) {
    try {
        console.log(`Extracting fully qualified names for ${input.languageId}`)

        const data = await extract(fqn, input)

        return { data, success: true }
    } catch (e) {
        console.error(`Failed to extract fully qualified names: ${e instanceof Error ? e.message : 'unknown'}`)
        return { success: false, error: e instanceof Error ? e.message : 'unknown' }
    }
}

worker({
    [FQN_WORKER_ID]: fqnWorker,
})
