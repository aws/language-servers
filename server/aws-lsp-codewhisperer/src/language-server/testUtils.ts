import { TextDocument } from 'vscode-languageserver-textdocument'
import { ResponseContext, Suggestion } from './codeWhispererService'

export const HELLO_WORLD_IN_CSHARP = `
class HelloWorld
{
    static void Main()
    {
        Console.WriteLine("Hello World!");
    }
}
`

export const SOME_FILE = TextDocument.create('file:///test.cs', 'csharp', 1, HELLO_WORLD_IN_CSHARP)
export const SOME_FILE_WITH_ALT_CASED_LANGUAGE_ID = TextDocument.create(
    // Use unsupported extension, so that we can test that we get a match based on the LanguageId
    'file:///test.seesharp',
    'CSharp',
    1,
    HELLO_WORLD_IN_CSHARP
)
export const SOME_CLOSED_FILE = TextDocument.create('file:///closed.cs', 'csharp', 1, HELLO_WORLD_IN_CSHARP)
export const SOME_UNSUPPORTED_FILE = TextDocument.create(
    'file:///hopper.fm',
    'flow-matic',
    1,
    'INPUT HELLO ; OUTPUT WORLD'
)
export const SOME_FILE_WITH_EXTENSION = TextDocument.create('file:///missing.hpp', '', 1, HELLO_WORLD_IN_CSHARP)

export const HELLO_WORLD_LINE = `Console.WriteLine("Hello World!");`
// Single line file will not have the full line contents
export const SINGLE_LINE_FILE_CUTOFF_INDEX = 2
export const SOME_SINGLE_LINE_FILE = TextDocument.create(
    'file:///single.cs',
    'csharp',
    1,
    HELLO_WORLD_LINE.substring(SINGLE_LINE_FILE_CUTOFF_INDEX)
)

export const EXPECTED_SUGGESTION: Suggestion[] = [{ itemId: 'cwspr-item-id', content: 'recommendation' }]

export const EXPECTED_RESPONSE_CONTEXT: ResponseContext = {
    requestId: 'cwspr-request-id',
    codewhispererSessionId: 'cwspr-session-id',
}
export const EXPECTED_SESSION_ID = 'some-random-session-uuid-0'

export const EXPECTED_RESULT = {
    sessionId: EXPECTED_SESSION_ID,
    items: [
        {
            itemId: EXPECTED_SUGGESTION[0].itemId,
            insertText: EXPECTED_SUGGESTION[0].content,
            range: undefined,
            references: undefined,
        },
    ],
}

export const EXPECTED_REFERENCE = {
    licenseName: 'test license',
    repository: 'test repository',
    url: 'test url',
    recommendationContentSpan: { start: 0, end: 1 },
}

export const EXPECTED_SUGGESTION_LIST: Suggestion[] = [
    { itemId: 'cwspr-item-id-1', content: 'recommendation without reference' },
    { itemId: 'cwspr-item-id-2', content: 'recommendation with reference', references: [EXPECTED_REFERENCE] },
]

export const EXPECTED_RESULT_WITH_REFERENCES = {
    sessionId: EXPECTED_SESSION_ID,
    items: [
        {
            itemId: EXPECTED_SUGGESTION_LIST[0].itemId,
            insertText: EXPECTED_SUGGESTION_LIST[0].content,
            range: undefined,
            references: undefined,
        },
        {
            itemId: EXPECTED_SUGGESTION_LIST[1].itemId,
            insertText: EXPECTED_SUGGESTION_LIST[1].content,
            range: undefined,
            references: [
                {
                    licenseName: EXPECTED_REFERENCE.licenseName,
                    referenceName: EXPECTED_REFERENCE.repository,
                    referenceUrl: EXPECTED_REFERENCE.url,
                    position: {
                        startCharacter: EXPECTED_REFERENCE.recommendationContentSpan?.start,
                        endCharacter: EXPECTED_REFERENCE.recommendationContentSpan?.end,
                    },
                },
            ],
        },
    ],
}

export const EXPECTED_RESULT_WITHOUT_REFERENCES = {
    sessionId: EXPECTED_SESSION_ID,
    items: [
        {
            itemId: EXPECTED_SUGGESTION_LIST[0].itemId,
            insertText: EXPECTED_SUGGESTION_LIST[0].content,
            range: undefined,
            references: undefined,
        },
    ],
}

export const EMPTY_RESULT = { items: [], sessionId: '' }
