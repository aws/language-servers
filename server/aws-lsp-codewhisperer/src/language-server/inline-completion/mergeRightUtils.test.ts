import {
    getPrefixOverlapLastIndex,
    getPrefixSuffixOverlap,
    mergeEditSuggestionsWithFileContext,
    truncateOverlapWithRightContext,
} from './mergeRightUtils'
import {
    HELLO_WORLD_IN_CSHARP,
    HELLO_WORLD_WITH_WINDOWS_ENDING,
    INCOMPLETE_HELLO_WORLD_IN_CSHARP,
    SAMPLE_SESSION_DATA_WITH_EXTRA_LEFT_CONTENT,
} from '../../shared/testUtils'
import assert = require('assert')
import { CodeWhispererSession } from './session/sessionManager'
import { TextDocument } from '@aws/language-server-runtimes/server-interface'

describe('Merge Right Utils', () => {
    const HELLO_WORLD = `Console.WriteLine("Hello World!");`

    it('get prefix suffix overlap works as expected', () => {
        const result = getPrefixSuffixOverlap('adwg31', '31ggrs')
        assert.deepEqual(result, '31')
    })

    it('get prefix prefix overlap index works as expected', () => {
        const result1 = getPrefixOverlapLastIndex('static void', 'static')
        assert.deepEqual(result1, 6)
        const result2 = getPrefixOverlapLastIndex('static void', 'void')
        assert.deepEqual(result2, 11)
        const result3 = getPrefixOverlapLastIndex('static void', 'staic')
        assert.deepEqual(result3, 3)
    })

    it('should return empty suggestion when right context equals line content ', () => {
        const result = truncateOverlapWithRightContext(HELLO_WORLD, HELLO_WORLD)
        assert.deepEqual(result, '')
    })

    it('should return empty suggestion when right context equals file content', () => {
        // Without trimStart, this test would fail because the function doesn't trim leading new line from right context
        const result = truncateOverlapWithRightContext(HELLO_WORLD_IN_CSHARP.trimStart(), HELLO_WORLD_IN_CSHARP)
        assert.deepEqual(result, '')
    })

    it('should not handle the case where right context fully matches suggestion but starts with a newline ', () => {
        const result = truncateOverlapWithRightContext('\n' + HELLO_WORLD_IN_CSHARP, HELLO_WORLD_IN_CSHARP)
        // Even though right context and suggestion are equal, the newline of right context doesn't get trimmed while the newline of suggestion gets trimmed
        // As a result, we end up with no overlap
        assert.deepEqual(result, HELLO_WORLD_IN_CSHARP)
    })

    it('should return truncated suggestion when right context matches end of the suggestion', () => {
        // File contents will be `nsole.WriteLine("Hello World!");`
        // Suggestion will be the full HELLO_WORLD
        // Final truncated result should be the first two letters of HELLO_WORLD
        const result = truncateOverlapWithRightContext(HELLO_WORLD.substring(2), HELLO_WORLD)

        assert.deepEqual(result, HELLO_WORLD.substring(0, 2))
    })

    it('should trim right-context tabs and whitespaces until first newline', () => {
        const suggestion = '{\n            return a + b;\n        }'
        const rightContent = '       \n        }\n\n    }\n}'
        const expected_result = '{\n            return a + b;'
        const result = truncateOverlapWithRightContext(rightContent, suggestion)

        assert.deepEqual(result, expected_result)
    })

    it('should handle different line endings', () => {
        const suggestion = '{\n            return a + b;\n        }'
        const rightContent = '\r\n        }\r\n}\r\n}'
        const expected_result = '{\n            return a + b;'
        const result = truncateOverlapWithRightContext(rightContent, suggestion)

        assert.deepEqual(result, expected_result)
    })

    it('should handle windows line endings for files', () => {
        const result = truncateOverlapWithRightContext(
            HELLO_WORLD_WITH_WINDOWS_ENDING,
            HELLO_WORLD_WITH_WINDOWS_ENDING.replaceAll('\r', '')
        )
        assert.deepEqual(result, '')
    })
})

describe('mergeEditSuggestionsWithFileContext', function () {
    const PREVIOUS_SESSION = new CodeWhispererSession(SAMPLE_SESSION_DATA_WITH_EXTRA_LEFT_CONTENT)
    const SUGGESTION_CONTENT =
        '--- file:///incomplete.cs\t1750894867455\n' +
        '+++ file:///incomplete.cs\t1750894887671\n' +
        '@@ -1,4 +1,9 @@\n' +
        'class HelloWorld\n' +
        '+{\n' +
        '+        static void Main(string[] args)\n' +
        '+    {\n' +
        '+        Console.WriteLine(\"Hello World!\");\n' +
        '+    }\n' +
        '+}\n' +
        '     \n' +
        '}\n' +
        '\\ No newline at end of file\n'

    beforeEach(() => {
        PREVIOUS_SESSION.suggestions = [{ content: SUGGESTION_CONTENT, itemId: 'itemId' }]
    })

    it('should return non-empty suggestion if user input matches prefix of the suggestion', () => {
        const userEdit = '{'
        const currentTextDocument = TextDocument.create(
            'file:///incomplete.cs',
            'csharp',
            1,
            INCOMPLETE_HELLO_WORLD_IN_CSHARP + userEdit
        )
        const fileContext = {
            filename: currentTextDocument.uri,
            programmingLanguage: { languageName: 'csharp' },
            leftFileContent: INCOMPLETE_HELLO_WORLD_IN_CSHARP + userEdit,
            rightFileContent: '',
        }
        const expectedNewDiff =
            '@@ -1,2 +1,8 @@\n' +
            ' class HelloWorld\n' +
            '-' +
            userEdit +
            '\n' +
            '\\ No newline at end of file\n' +
            '+' +
            userEdit +
            '\n' +
            '+        static void Main(string[] args)\n' +
            '+    {\n' +
            '+        Console.WriteLine("Hello World!");\n' +
            '+    }\n' +
            '+}\n' +
            '+    \n' +
            '\\ No newline at end of file\n'
        const mergedSuggestions = mergeEditSuggestionsWithFileContext(
            PREVIOUS_SESSION,
            currentTextDocument,
            fileContext
        )
        assert.deepEqual(mergedSuggestions.length, 1)
        const insertText = (mergedSuggestions[0].insertText as string).split('\n').slice(2).join('\n')
        assert.deepEqual(insertText, expectedNewDiff)
    })

    it('should return non-empty suggestion if user input contains extra white space prefix', () => {
        const userEdit = '    {'
        const currentTextDocument = TextDocument.create(
            'file:///incomplete.cs',
            'csharp',
            1,
            INCOMPLETE_HELLO_WORLD_IN_CSHARP + userEdit
        )
        const fileContext = {
            filename: currentTextDocument.uri,
            programmingLanguage: { languageName: 'csharp' },
            leftFileContent: INCOMPLETE_HELLO_WORLD_IN_CSHARP + userEdit,
            rightFileContent: '',
        }
        const expectedNewDiff =
            '@@ -1,2 +1,8 @@\n' +
            ' class HelloWorld\n' +
            '-' +
            userEdit +
            '\n' +
            '\\ No newline at end of file\n' +
            '+' +
            userEdit +
            '\n' +
            '+        static void Main(string[] args)\n' +
            '+    {\n' +
            '+        Console.WriteLine("Hello World!");\n' +
            '+    }\n' +
            '+}\n' +
            '+    \n' +
            '\\ No newline at end of file\n'
        const mergedSuggestions = mergeEditSuggestionsWithFileContext(
            PREVIOUS_SESSION,
            currentTextDocument,
            fileContext
        )
        assert.deepEqual(mergedSuggestions.length, 1)
        const insertText = (mergedSuggestions[0].insertText as string).split('\n').slice(2).join('\n')
        assert.deepEqual(insertText, expectedNewDiff)
    })

    it('should return empty suggestion if user input contains a deletion', () => {
        const currentTextDocument = TextDocument.create(
            'file:///incomplete.cs',
            'csharp',
            1,
            INCOMPLETE_HELLO_WORLD_IN_CSHARP.substring(0, -3)
        )
        const fileContext = {
            filename: currentTextDocument.uri,
            programmingLanguage: { languageName: 'csharp' },
            leftFileContent: INCOMPLETE_HELLO_WORLD_IN_CSHARP.substring(0, -3),
            rightFileContent: '',
        }
        const mergedSuggestions = mergeEditSuggestionsWithFileContext(
            PREVIOUS_SESSION,
            currentTextDocument,
            fileContext
        )
        assert.deepEqual(mergedSuggestions.length, 0)
    })

    it('should return empty suggestion if user input contains a line break', () => {
        const userEdit = '\n'
        const currentTextDocument = TextDocument.create(
            'file:///incomplete.cs',
            'csharp',
            1,
            INCOMPLETE_HELLO_WORLD_IN_CSHARP.substring(0, -3)
        )
        const fileContext = {
            filename: currentTextDocument.uri,
            programmingLanguage: { languageName: 'csharp' },
            leftFileContent: INCOMPLETE_HELLO_WORLD_IN_CSHARP + userEdit,
            rightFileContent: '',
        }
        const mergedSuggestions = mergeEditSuggestionsWithFileContext(
            PREVIOUS_SESSION,
            currentTextDocument,
            fileContext
        )
        assert.deepEqual(mergedSuggestions.length, 0)
    })

    it('should return non-empty suggestion if user input matches a part of the suggestion', () => {
        const userEdit = '{\n        void'
        const currentTextDocument = TextDocument.create(
            'file:///incomplete.cs',
            'csharp',
            1,
            INCOMPLETE_HELLO_WORLD_IN_CSHARP + userEdit
        )
        const fileContext = {
            filename: currentTextDocument.uri,
            programmingLanguage: { languageName: 'csharp' },
            leftFileContent: INCOMPLETE_HELLO_WORLD_IN_CSHARP + userEdit,
            rightFileContent: '',
        }
        const expectedNewDiff =
            '@@ -1,3 +1,8 @@\n' +
            ' class HelloWorld\n' +
            ' {\n' +
            '-        void\n' +
            '\\ No newline at end of file\n' +
            '+        void Main(string[] args)\n' +
            '+    {\n' +
            '+        Console.WriteLine("Hello World!");\n' +
            '+    }\n' +
            '+}\n' +
            '+    \n' +
            '\\ No newline at end of file\n'
        const mergedSuggestions = mergeEditSuggestionsWithFileContext(
            PREVIOUS_SESSION,
            currentTextDocument,
            fileContext
        )
        assert.deepEqual(mergedSuggestions.length, 1)
        const insertText = (mergedSuggestions[0].insertText as string).split('\n').slice(2).join('\n')
        assert.deepEqual(insertText, expectedNewDiff)
    })
})
