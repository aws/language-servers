export class DuckTyper {
    private static requirePropertyRule = 'requireProperty'
    private static optionalPropertyRule = 'optionalProperty'
    private static disallowPropertyRule = 'disallowProperty'

    private rules: Record<string, string> = {}

    requireProperty(name: string): DuckTyper {
        this.rules[name] = DuckTyper.requirePropertyRule
        return this
    }

    // Rule is only useful when onlyDefined === true
    optionalProperty(name: string): DuckTyper {
        this.rules[name] = DuckTyper.optionalPropertyRule
        return this
    }

    disallowProperty(name: string): DuckTyper {
        this.rules[name] = DuckTyper.disallowPropertyRule
        return this
    }

    eval(value: object, onlyDefined: boolean = false): boolean {
        if (!value) {
            return false
        }

        const propertyNames = new Set<string>(Object.keys(value))

        for (const rule of Object.entries(this.rules)) {
            const propertyName = rule[0]
            const ruleType = rule[1]

            switch (ruleType) {
                case DuckTyper.requirePropertyRule:
                    if (!propertyNames.delete(propertyName)) {
                        return false
                    }
                    break
                case DuckTyper.optionalPropertyRule:
                    propertyNames.delete(propertyName)
                    break
                case DuckTyper.disallowPropertyRule:
                    if (propertyNames.delete(propertyName)) {
                        return false
                    }
                    break
                default:
                    throw new Error(`Unexpected DuckTyper rule type ${ruleType}`)
            }
        }

        return !onlyDefined || propertyNames.size === 0
    }
}
