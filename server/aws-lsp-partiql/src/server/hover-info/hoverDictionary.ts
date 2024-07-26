export const hoverDictionary = {
    keyword: {
        as: {
            markdown: ['```typescript', '(keyword) AS: rename a table or column', '```'].join('\n'),
            plaintext: '(keyword) AS: rename a table or column',
        },
        select: {
            markdown: ['```typescript', '(keyword) SELECT: select data from a database', '```'].join('\n'),
            plaintext: '(keyword) SELECT: select data from a database',
        },
        from: {
            markdown: ['```typescript', '(keyword) FROM: indicate the source of the data', '```'].join('\n'),
            plaintext: '(keyword) FROM: indicate the source of the data',
        },
        where: {
            markdown: [
                '```typescript',
                '(keyword) WHERE: bindings produced from the FROM clause -> the ones satisfying its condition',
                '```',
            ].join('\n'),
            plaintext: '(keyword) WHERE: bindings produced from the FROM clause -> the ones satisfying its condition',
        },
        group: {
            markdown: [
                '```typescript',
                '(keyword) GROUP BY: a standalone operator that inputs a collection of binding tuples and outputs a collection of binding tuples',
                '```',
            ].join('\n'),
            plaintext:
                '(keyword) GROUP BY: a standalone operator that inputs a collection of binding tuples and outputs a collection of binding tuples',
        },
        having: {
            markdown: [
                '```typescript',
                '(keyword) HAVING: bindings produced from the FROM clause -> the ones satisfying its condition',
                '```',
            ].join('\n'),
            plaintext: '(keyword) HAVING: bindings produced from the FROM clause -> the ones satisfying its condition',
        },
        order: {
            markdown: [
                '```typescript',
                '(keyword) ORDER BY: order the output data and turning its input bag into an array',
                '```',
            ].join('\n'),
            plaintext: '(keyword) ORDER BY: order the output data and turning its input bag into an array',
        },
        limit: {
            markdown: [
                '```typescript',
                '(keyword) LIMIT ... OFFSET: input form `LIMIT <N> OFFSET <M>` and returns the first N binding tuples of its input collection, skipping the first M if an OFFSET is specified.',
                '```',
            ].join('\n'),
            plaintext:
                '(keyword) LIMIT ... OFFSET: input form `LIMIT <N> OFFSET <M>` and returns the first N binding tuples of its input collection, skipping the first M if an OFFSET is specified.',
        },
        pivot: {
            markdown: [
                '```typescript',
                '(keyword) PIVOT: a bag or an array of binding tuples -> a tuple where the each input binding is evaluated to an attribute value pair in the tuple',
                '```',
            ].join('\n'),
            plaintext:
                '(keyword) PIVOT: a bag or an array of binding tuples -> a tuple where the each input binding is evaluated to an attribute value pair in the tuple',
        },
        unpivot: {
            markdown: [
                '```typescript',
                '(keyword) UNPIVOT: a single tuple with attribute-value pairs ->  a collection of bindings',
                '```',
            ].join('\n'),
            plaintext: '(keyword) UNPIVOT: a single tuple with attribute-value pairs ->  a collection of bindings',
        },
        join: {
            markdown: ['```typescript', '(keyword) JOIN: combine multiple items in a single FROM clause', '```'].join(
                '\n'
            ),
            plaintext: '(keyword) JOIN: combine multiple items in a single FROM clause',
        },
    },
    constant: {
        null: {
            markdown: [
                '```typescript',
                '(keyword) NULL: represents a null value for an existing attribute',
                '```',
            ].join('\n'),
            plaintext: '(keyword) NULL: represents a null value for an existing attribute',
        },
        true: {
            markdown: ['```typescript', '(keyword) TRUE: used to test for true values', '```'].join('\n'),
            plaintext: '(keyword) TRUE: used to test for true values',
        },
        false: {
            markdown: ['```typescript', '(keyword) FALSE: used to test for false values', '```'].join('\n'),
            plaintext: '(keyword) FALSE: used to test for false values',
        },
        missing: {
            markdown: [
                '```typescript',
                '(keyword) MISSING: signifies the absence of an attribute in semi-structured data',
                '```',
            ].join('\n'),
            plaintext: '(keyword) MISSING: signifies the absence of an attribute in semi-structured data',
        },
    },
}
