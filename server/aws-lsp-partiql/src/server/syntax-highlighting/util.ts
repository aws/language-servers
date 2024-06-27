import {
    SemanticTokenModifiers,
    SemanticTokenTypes,
    Range,
    SemanticTokensLegend,
} from '@aws/language-server-runtimes/server-interface'

export interface SemanticToken {
    range: Range
    tokenType: SemanticTokenTypes
    /**
     * An optional array of modifiers for this token
     */
    tokenModifiers?: SemanticTokenModifiers[]
}

export const semanticTokensLegend = {
    tokenTypes: [
        SemanticTokenTypes.keyword,
        SemanticTokenTypes.type,
        SemanticTokenTypes.number,
        SemanticTokenTypes.string,
        SemanticTokenTypes.function,
        SemanticTokenTypes.variable,
        SemanticTokenTypes.comment,
        SemanticTokenTypes.operator,
    ],
    tokenModifiers: [],
} as SemanticTokensLegend

export const string2TokenTypes: { [key: string]: SemanticTokenTypes } = {
    tuple_punc_start: SemanticTokenTypes.operator,
    tuple_punc_end: SemanticTokenTypes.operator,
    tuple_punc_separator: SemanticTokenTypes.operator,
    pair_punc_separator: SemanticTokenTypes.operator,
    array_punc_start: SemanticTokenTypes.operator,
    array_punc_end: SemanticTokenTypes.operator,
    array_punc_separator: SemanticTokenTypes.operator,
    bag_punc_start: SemanticTokenTypes.operator,
    bag_punc_end: SemanticTokenTypes.operator,
    bag_punc_separator: SemanticTokenTypes.operator,
    ion: SemanticTokenTypes.string,
}
