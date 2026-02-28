import * as Fuzz from 'fuzzball'

interface DetailedResult {
    suggestionIndex: number
    suggestion: string
    groundTruth: string
    editSimilarity: number
    exactMatch: boolean
}

interface EditDistanceResult {
    emRatio: number
    editSimAvg: number
    detailedResults: DetailedResult[]
}

function calEditSim(target: string, truth: string): number {
    let editSim = 0.0

    const pred = truth.trim()
    const gt = target.trim()
    editSim += Fuzz.ratio(pred, gt)

    return editSim
}

function computeEditDistances(suggestions: string[], truth: string): EditDistanceResult {
    if (suggestions.length === 0) {
        throw new Error('empty suggestion')
    }

    if (!truth.length) {
        throw new Error('empty ground truth')
    }

    const detailedResults: DetailedResult[] = []
    let editSim = 0
    let exactMatchCnt = 0

    for (let idx = 0; idx < suggestions.length; idx++) {
        const suggestion = suggestions[idx]

        const es = calEditSim(suggestion, truth)
        const em = suggestion === truth
        if (em) {
            exactMatchCnt++
        }

        editSim += es

        detailedResults.push({
            suggestionIndex: idx,
            suggestion: suggestion,
            groundTruth: truth,
            editSimilarity: es,
            exactMatch: em,
        })
    }

    const totalSamples = suggestions.length
    const editSimAvg = totalSamples > 0 ? Math.round((editSim / totalSamples) * 100) / 100 : -1
    const emRatio = exactMatchCnt / totalSamples

    return {
        emRatio,
        editSimAvg,
        detailedResults,
    }
}
