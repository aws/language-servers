import { calculateModifiedLines } from './fileModificationMetrics'
import { ToolUse } from '@amzn/codewhisperer-streaming'
import { FS_WRITE, FS_REPLACE } from '../constants/toolConstants'
import * as assert from 'assert'

describe('calculateModifiedLines', () => {
    describe('FS_WRITE', () => {
        it('should count lines for create command', () => {
            const toolUse: ToolUse = {
                toolUseId: 'test-1',
                name: FS_WRITE,
                input: {
                    command: 'create',
                    path: '/test/file.txt',
                    fileText: 'line1\nline2\nline3',
                },
            }
            const afterContent = 'line1\nline2\nline3'

            assert.strictEqual(calculateModifiedLines(toolUse, afterContent), 3)
        })

        it('should count lines for append command', () => {
            const toolUse: ToolUse = {
                toolUseId: 'test-2',
                name: FS_WRITE,
                input: {
                    command: 'append',
                    path: '/test/file.txt',
                    fileText: 'line4\nline5',
                },
            }

            assert.strictEqual(calculateModifiedLines(toolUse), 2)
        })

        it('should handle empty content', () => {
            const toolUse: ToolUse = {
                toolUseId: 'test-3',
                name: FS_WRITE,
                input: {
                    command: 'create',
                    path: '/test/file.txt',
                    fileText: '',
                },
            }

            assert.strictEqual(calculateModifiedLines(toolUse, ''), 0)
        })
    })

    describe('FS_REPLACE', () => {
        it('should count replaced lines correctly (double counting)', () => {
            const toolUse: ToolUse = {
                toolUseId: 'test-4',
                name: FS_REPLACE,
                input: {
                    path: '/test/file.txt',
                    diffs: [
                        {
                            oldStr: 'old line 1\nold line 2\nold line 3',
                            newStr: 'new line 1\nnew line 2\nnew line 3',
                        },
                    ],
                },
            }

            assert.strictEqual(calculateModifiedLines(toolUse), 6)
        })

        it('should count pure deletions', () => {
            const toolUse: ToolUse = {
                toolUseId: 'test-5',
                name: FS_REPLACE,
                input: {
                    path: '/test/file.txt',
                    diffs: [
                        {
                            oldStr: 'line to delete 1\nline to delete 2',
                            newStr: '',
                        },
                    ],
                },
            }

            assert.strictEqual(calculateModifiedLines(toolUse), 2)
        })

        it('should count pure insertions', () => {
            const toolUse: ToolUse = {
                toolUseId: 'test-6',
                name: FS_REPLACE,
                input: {
                    path: '/test/file.txt',
                    diffs: [
                        {
                            oldStr: '',
                            newStr: 'new line 1\nnew line 2',
                        },
                    ],
                },
            }

            assert.strictEqual(calculateModifiedLines(toolUse), 2)
        })

        it('should handle multiple diffs', () => {
            const toolUse: ToolUse = {
                toolUseId: 'test-7',
                name: FS_REPLACE,
                input: {
                    path: '/test/file.txt',
                    diffs: [
                        {
                            oldStr: 'old line 1',
                            newStr: 'new line 1',
                        },
                        {
                            oldStr: 'delete this line',
                            newStr: '',
                        },
                    ],
                },
            }

            assert.strictEqual(calculateModifiedLines(toolUse), 3)
        })
    })

    it('should return 0 for unknown tools', () => {
        const toolUse: ToolUse = {
            toolUseId: 'test-8',
            name: 'unknownTool',
            input: {},
        }

        assert.strictEqual(calculateModifiedLines(toolUse), 0)
    })
})
