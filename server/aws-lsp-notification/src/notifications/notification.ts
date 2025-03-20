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

// https://stackoverflow.com/questions/62158066/typescript-type-where-an-object-consists-of-exactly-a-single-property-of-a-set-o
type Explode<T> = keyof T extends infer K
    ? K extends unknown
        ? { [I in keyof T]: I extends K ? T[I] : never }
        : never
    : never
type AtMostOne<T> = Explode<Partial<T>>
type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U]
type ExactlyOne<T> = AtMostOne<T> & AtLeastOne<T>
