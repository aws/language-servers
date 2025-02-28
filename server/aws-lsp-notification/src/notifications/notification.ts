import { MessageType } from '@aws/language-server-runtimes/protocol'

export interface Notification {
    id: string
    type: MessageType
    criteria: Criteria
    content: Record<
        string, // locale
        {
            title?: string
            text: string
        }
    >
    actions?: Action[]
}

type Operation = ExactlyOne<{
    '==': string
    '!=': string
    '<': string
    '<=': string
    '>': string
    '>=': string
    anyOf: string[]
    noneOf: string[]
}> & { defaultValue?: string }

type Expression =
    | Operation
    | { not: Expression }
    // Conjunctions as arrays implicitly provide grouping
    | { and: Expression[] }
    | { or: Expression[] }

type Criteria = Record<string, Record<string, Expression>>

type Action = {
    type: string
    content: Record<
        string, // locale
        {
            text: string
            uri?: string
        }
    >
}

// https://stackoverflow.com/questions/62158066/typescript-type-where-an-object-consists-of-exactly-a-single-property-of-a-set-o
type Explode<T> = keyof T extends infer K
    ? K extends unknown
        ? { [I in keyof T]: I extends K ? T[I] : never }
        : never
    : never
type AtMostOne<T> = Explode<Partial<T>>
type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U]
type ExactlyOne<T> = AtMostOne<T> & AtLeastOne<T>
