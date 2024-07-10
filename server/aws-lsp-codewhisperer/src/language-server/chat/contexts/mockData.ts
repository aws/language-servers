export const mockExtractedSymbols = {
    fullyQualified: {
        declaredSymbols: [
            {
                source: ['node:fs'],
                symbol: [],
                extent: {
                    start: { line: 0, character: 7 },
                    end: { line: 0, character: 9 },
                },
            },
            {
                source: ['node:path'],
                symbol: [],
                extent: {
                    start: { line: 1, character: 7 },
                    end: { line: 1, character: 11 },
                },
            },
        ],
        usedSymbols: [
            {
                source: ['node:path'],
                symbol: [],
                extent: {
                    start: { line: 3, character: 16 },
                    end: { line: 3, character: 20 },
                },
            },
            {
                source: ['node:path'],
                symbol: ['join'],
                extent: {
                    start: { line: 3, character: 21 },
                    end: { line: 3, character: 25 },
                },
            },
            {
                source: ['node:fs'],
                symbol: [],
                extent: {
                    start: { line: 6, character: 0 },
                    end: { line: 6, character: 2 },
                },
            },
            {
                source: ['node:fs'],
                symbol: ['mkdir'],
                extent: {
                    start: { line: 6, character: 3 },
                    end: { line: 6, character: 8 },
                },
            },
            {
                source: ['node:fs'],
                symbol: [],
                extent: {
                    start: { line: 7, character: 2 },
                    end: { line: 7, character: 4 },
                },
            },
            {
                source: ['node:fs'],
                symbol: ['writeFile'],
                extent: {
                    start: { line: 7, character: 5 },
                    end: { line: 7, character: 14 },
                },
            },
            {
                source: ['node:path'],
                symbol: [],
                extent: {
                    start: { line: 7, character: 15 },
                    end: { line: 7, character: 19 },
                },
            },
            {
                source: ['node:path'],
                symbol: ['resolve'],
                extent: {
                    start: { line: 7, character: 20 },
                    end: { line: 7, character: 27 },
                },
            },
        ],
    },
}

export const expectedExtractedNames = [
    { name: 'join', type: 'USAGE', source: 'node:path' },
    { name: 'mkdir', type: 'USAGE', source: 'node:fs' },
    { name: 'writeFile', type: 'USAGE', source: 'node:fs' },
    { name: 'resolve', type: 'USAGE', source: 'node:path' },
]
