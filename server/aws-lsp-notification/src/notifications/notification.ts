// Metadata
export interface Metadata {
    schema: string
    comments?: string
}

// Notifications
export interface Notification {
    id: string
    condition?: Condition
    context?: string
    content: Content
    presentationHints?: PresentationHints
    clientCommands?: ClientCommand[]
}

// Operations used for both scalar and set values
type Operation = ExactlyOne<{
    '==': string // For sets, client state contains only the expression values
    '!=': string // For sets, negation of == for sets
    '<': string // For sets, client state is a proper subset of expression values
    '<=': string // For sets, client state is a subset of expression values
    '>': string // For sets, client state is a proper superset of expression values
    '>=': string // For sets, client state is a superset of expression values
}>

type Expression =
    | Operation
    | { not: Expression }
    // Conjunctions as arrays implicitly provide grouping
    | { and: Expression[] }
    | { or: Expression[] }

type Condition = Record<string, Record<string, Expression>>

type Locale = string

type ContentItem = { title?: string; text: string }

type Content = Record<Locale, ContentItem>

type PresentationHints = Record<string, string>

type ClientCommandContentItem = {
    text: string
    uri?: string
}

type ClientCommand = {
    command: string
    content: Record<Locale, ClientCommandContentItem>
}

/**
 * ExactlyOne<T> ensures that an object has exactly one property from the set of properties in T.
 * This is used to enforce that operations like '==', '!=', etc. can only appear once in a condition.
 *
 * How it works:
 * For each key K in T, it creates an object type that:
 * 1. Has the property K with type T[K]
 * 2. Makes all other properties in T have type 'never', effectively disallowing them
 * 3. Combines these object types into a union
 *
 * For example, ExactlyOne<{a: string, b: number}> becomes:
 * {a: string, b?: never} | {a?: never, b: number}
 *
 * Reference: https://stackoverflow.com/questions/62158066/typescript-type-where-an-object-consists-of-exactly-a-single-property-of-a-set-o
 */
type ExactlyOne<T> = {
    [K in keyof T]: { [P in K]: T[P] } & { [P in Exclude<keyof T, K>]?: never }
}[keyof T]
