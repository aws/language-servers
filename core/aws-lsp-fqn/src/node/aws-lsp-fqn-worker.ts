import * as fqn from '@aws/fully-qualified-names'
import { worker } from 'workerpool'
import { FQN_WORKER_ID } from '../common/defaults'
import { extract } from '../common/fqnExtractor'
import { FqnExtractorInput } from '../common/types'

async function fqnWorker(input: FqnExtractorInput) {
    try {
        const data = await extract(fqn, input)

        return { data, success: true }
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : 'unknown' }
    }
}

worker({
    [FQN_WORKER_ID]: fqnWorker,
})
