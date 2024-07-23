export const hoverDictionary = {
    keyword: {
        as: ['```typescript', '(keyword) AS: rename a table or column', '```'].join('\n'),
        select: ['```typescript', '(keyword) SELECT: select data from a database', '```'].join('\n'),
        from: ['```typescript', '(keyword) FROM: indicate the source of the data', '```'].join('\n'),
        where: [
            '```typescript',
            '(keyword) WHERE: bindings produced from the FROM clause -> the ones satisfying its condition',
            '```',
        ].join('\n'),
        group: [
            '```typescript',
            '(keyword) GROUP BY: a standalone operator that inputs a collection of binding tuples and outputs a collection of binding tuples',
            '```',
        ].join('\n'),
        having: [
            '```typescript',
            '(keyword) HAVING: bindings produced from the FROM clause -> the ones satisfying its condition',
            '```',
        ].join('\n'),
        order: [
            '```typescript',
            '(keyword) ORDER BY: order the output data and turning its input bag into an array',
            '```',
        ].join('\n'),
        limit: [
            '```typescript',
            '(keyword) LIMIT ... OFFSET: input form `LIMIT <N> OFFSET <M>` and returns the first N binding tuples of its input collection, skipping the first M if an OFFSET is specified.',
            '```',
        ].join('\n'),
        pivot: [
            '```typescript',
            '(keyword) PIVOT: a bag or an array of binding tuples -> a tuple where the each input binding is evaluated to an attribute value pair in the tuple',
            '```',
        ].join('\n'),
        unpivot: [
            '```typescript',
            '(keyword) UNPIVOT: a single tuple with attribute-value pairs ->  a collection of bindings',
            '```',
        ].join('\n'),
        join: ['```typescript', '(keyword) JOIN: combinemultiple items in a single FROM clause', '```'].join('\n'),
    },
    constant: {
        null: ['```typescript', '(keyword) NULL: represents a null value for an existing attribute', '```'].join('\n'),
        true: ['```typescript', '(keyword) TRUE: used to test for true values', '```'].join('\n'),
        false: ['```typescript', '(keyword) FALSE: used to test for false values', '```'].join('\n'),
        missing: [
            '```typescript',
            '(keyword) MISSING: signifies the absence of an attribute in semi-structured data',
            '```',
        ].join('\n'),
    },
}
