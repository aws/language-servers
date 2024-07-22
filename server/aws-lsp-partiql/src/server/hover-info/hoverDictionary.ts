export const hoverDictionary = {
    keyword: {
        as: [
            '### AS',
            'The AS keyword is optionally used when renaming a table or column. Aliases provide users with the ability to reduce the amount of code required for a query.',
            '',
            'Visit [PartiQL Documentation](https://partiql.org/dql/as.html)',
        ].join('\n'),
        select: [
            '### SELECT',
            'The SELECT keyword is used to select data from a database.',
            '',
            'Visit [PartiQL Documentation](https://partiql.org/dql/select.html)',
        ].join('\n'),
        from: [
            '### FROM',
            'The FROM keyword is used to indicate the source of the data.',
            '',
            'Visit [PartiQL Documentation](https://partiql.org/dql/from.html)',
        ].join('\n'),
        where: [
            '### WHERE',
            'The WHERE clause inputs the bindings that have been produced from the FROM clause and outputs the ones that satisfy its condition.',
            '',
            'Visit [PartiQL Documentation](https://partiql.org/dql/where.html)',
        ].join('\n'),
        group: [
            '### GROUP BY',
            'The GROUP BY keyword in PartiQL is a standalone operator that inputs a collection of binding tuples and outputs a collection of binding tuples.',
            '',
            'Visit [PartiQL Documentation](https://partiql.org/dql/group_by.html)',
        ].join('\n'),
        having: [
            '### HAVING',
            'The HAVING clause is identifical to the WHERE clause, and is applied after the GROUP BY clause.',
            '',
            'Visit [PartiQL Documentation](https://partiql.org/dql/having.html)',
        ].join('\n'),
        order: [
            '### ORDER BY',
            'The ORDER BY keyword is used to turn its input bag into an array.',
            '',
            'Visit [PartiQL Documentation](https://partiql.org/dql/order_by.html)',
        ].join('\n'),
        limit: [
            '### LIMIT ... OFFSET',
            'The LIMIT …​ OFFSET clause takes the form `LIMIT <N> OFFSET <M>` and returns the first N binding tuples of its input collection, skipping the first M if an OFFSET is specified.',
            '',
            'Visit [PartiQL Documentation](https://partiql.org/dql/fetch.html)',
        ].join('\n'),
        pivot: [
            '### PIVOT',
            'The PIVOT keyword converts a collection of bindings into a single tuple with each binding as an attribute-value pair.',
            '',
            'Visit [PartiQL Documentation](https://partiql.org/dql/pivot.html)',
        ].join('\n'),
        unpivot: [
            '### UNPIVOT',
            'The UNPIVOT keyword converts a single tuple with attribute-value pairs into a collection of bindings.',
            '',
            'Visit [PartiQL Documentation](https://partiql.org/assets/PartiQL-Specification.pdf)',
        ].join('\n'),
        join: [
            '### JOIN',
            'The JOIN keyword is used to combinemultiple items in a single FROM clause.',
            '',
            'Visit [PartiQL Documentation](https://partiql.org/dql/joins.html)',
        ].join('\n'),
    },
    constant: {
        null: [
            '### NULL',
            'The NULL constant represents a null value for an existing attribute.',
            '',
            'Visit [PartiQL Documentation](https://partiql.org/assets/PartiQL-Specification.pdf)',
        ].join('\n'),
        true: [
            '### TRUE',
            'The TRUE constant is used to test for true values.',
            '',
            'Visit [PartiQL Documentation](https://partiql.org/assets/PartiQL-Specification.pdf)',
        ].join('\n'),
        false: [
            '### FALSE',
            'The FALSE constant is used to test for false values.',
            '',
            'Visit [PartiQL Documentation](https://partiql.org/assets/PartiQL-Specification.pdf)',
        ].join('\n'),
        missing: [
            '### MISSING',
            'The MISSING constant signifies the absence of an attribute in semi-structured data.',
            '',
            'Visit [PartiQL Documentation](https://partiql.org/assets/PartiQL-Specification.pdf)',
        ].join('\n'),
    },
}
