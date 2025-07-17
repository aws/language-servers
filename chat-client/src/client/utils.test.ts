import * as assert from 'assert'
import { MynahIcons } from '@aws/mynah-ui'
import { Button, ChatMessage } from '@aws/language-server-runtimes-types'
import { FeatureContext } from '@aws/chat-client-ui-types'
import {
    toMynahIcon,
    toMynahButtons,
    toMynahHeader,
    toMynahFileList,
    toDetailsWithoutIcon,
    toMynahContextCommand,
} from './utils'

describe('utils', () => {
    describe('toMynahIcon', () => {
        it('returns valid MynahIcon when icon exists', () => {
            const result = toMynahIcon(MynahIcons.CHAT)
            assert.equal(result, MynahIcons.CHAT)
        })

        it('returns undefined for invalid icon', () => {
            const result = toMynahIcon('invalid-icon')
            assert.equal(result, undefined)
        })

        it('returns undefined for undefined input', () => {
            const result = toMynahIcon(undefined)
            assert.equal(result, undefined)
        })
    })

    describe('toMynahButtons', () => {
        it('converts buttons with valid icons', () => {
            const buttons: Button[] = [
                { id: 'btn1', text: 'Button 1', icon: MynahIcons.CHAT },
                { id: 'btn2', text: 'Button 2', icon: 'invalid-icon' },
            ]

            const result = toMynahButtons(buttons)
            assert.equal(result?.length, 2)
            assert.equal(result?.[0].icon, MynahIcons.CHAT)
            assert.equal(result?.[1].icon, undefined)
        })

        it('returns undefined for undefined input', () => {
            const result = toMynahButtons(undefined)
            assert.equal(result, undefined)
        })

        it('handles empty array', () => {
            const result = toMynahButtons([])
            assert.deepEqual(result, [])
        })
    })

    describe('toMynahHeader', () => {
        it('converts header with all properties', () => {
            const header: ChatMessage['header'] = {
                icon: MynahIcons.CHAT,
                buttons: [{ id: 'btn1', text: 'Button', icon: MynahIcons.OK }],
                status: { text: 'Status', icon: MynahIcons.WARNING },
                summary: {
                    content: {
                        body: 'Test summary',
                    },
                },
            }

            const result = toMynahHeader(header)
            assert.equal(result?.icon, MynahIcons.CHAT)
            assert.equal(result?.buttons?.length, 1)
            assert.equal(result?.status?.text, 'Status')
            assert.equal(result?.status?.icon, MynahIcons.WARNING)
            assert.equal(result?.summary?.content?.body, 'Test summary')
        })

        it('handles header without status', () => {
            const header: ChatMessage['header'] = {
                icon: MynahIcons.CHAT,
            }

            const result = toMynahHeader(header)
            assert.equal(result?.status, undefined)
        })

        it('returns undefined for undefined header', () => {
            const result = toMynahHeader(undefined)
            assert.equal(result, undefined)
        })

        it('handles header with invalid icons', () => {
            const header: ChatMessage['header'] = {
                icon: 'invalid-icon',
                status: { text: 'Status', icon: 'invalid-status-icon' },
            }

            const result = toMynahHeader(header)
            assert.equal(result?.icon, undefined)
            assert.equal(result?.status?.icon, undefined)
        })
    })

    describe('toMynahFileList', () => {
        it('converts file list with all properties', () => {
            const fileList: ChatMessage['fileList'] = {
                filePaths: ['src/file1.ts', 'src/file2.ts'],
                rootFolderTitle: 'Project Root',
                details: {
                    'src/file1.ts': {
                        lineRanges: [{ first: 1, second: 10 }],
                        description: 'First file',
                        fullPath: '/full/path/src/file1.ts',
                    },
                    'src/file2.ts': {
                        lineRanges: [{ first: -1, second: -1 }],
                        description: 'Second file',
                    },
                },
            }

            const result = toMynahFileList(fileList)
            assert.equal(result?.rootFolderTitle, 'Project Root')
            assert.equal(result?.filePaths?.length, 2)
            assert.equal(result?.flatList, true)
            assert.equal(result?.hideFileCount, true)
            assert.equal(result?.collapsed, true)
            assert.equal(result?.details?.['src/file1.ts']?.label, 'line 1 - 10')
            assert.equal(result?.details?.['src/file1.ts']?.description, 'First file')
            assert.equal(result?.details?.['src/file1.ts']?.visibleName, 'file1.ts')
            assert.equal(result?.details?.['src/file2.ts']?.label, '')
        })

        it('uses default root folder title when not provided', () => {
            const fileList: ChatMessage['fileList'] = {
                filePaths: ['file.ts'],
            }

            const result = toMynahFileList(fileList)
            assert.equal(result?.rootFolderTitle, 'Context')
        })

        it('returns undefined for undefined input', () => {
            const result = toMynahFileList(undefined)
            assert.equal(result, undefined)
        })

        it('handles file paths with different structures', () => {
            const fileList: ChatMessage['fileList'] = {
                filePaths: ['simple.ts', 'folder/nested.ts', 'deep/nested/path/file.ts'],
                details: {
                    'simple.ts': {},
                    'folder/nested.ts': {},
                    'deep/nested/path/file.ts': {},
                },
            }

            const result = toMynahFileList(fileList)
            assert.equal(result?.details?.['simple.ts']?.visibleName, 'simple.ts')
            assert.equal(result?.details?.['folder/nested.ts']?.visibleName, 'nested.ts')
            assert.equal(result?.details?.['deep/nested/path/file.ts']?.visibleName, 'file.ts')
        })

        it('handles multiple line ranges', () => {
            const fileList: ChatMessage['fileList'] = {
                filePaths: ['file.ts'],
                details: {
                    'file.ts': {
                        lineRanges: [
                            { first: 1, second: 5 },
                            { first: 10, second: 15 },
                        ],
                    },
                },
            }

            const result = toMynahFileList(fileList)
            assert.equal(result?.details?.['file.ts']?.label, 'line 1 - 5, line 10 - 15')
        })
    })

    describe('toDetailsWithoutIcon', () => {
        it('removes icons from details', () => {
            const details = {
                'file1.ts': {
                    label: 'File 1',
                    icon: MynahIcons.FILE,
                    description: 'First file',
                },
                'file2.ts': {
                    label: 'File 2',
                    description: 'Second file',
                },
            }

            const result = toDetailsWithoutIcon(details)
            assert.equal(result['file1.ts'].icon, null)
            assert.equal(result['file1.ts'].label, 'File 1')
            assert.equal(result['file2.ts'].icon, null)
            assert.equal(result['file2.ts'].label, 'File 2')
        })

        it('handles undefined input', () => {
            const result = toDetailsWithoutIcon(undefined)
            assert.deepEqual(result, {})
        })

        it('handles empty object', () => {
            const result = toDetailsWithoutIcon({})
            assert.deepEqual(result, {})
        })
    })

    describe('toMynahContextCommand', () => {
        it('converts feature context with string value', () => {
            const feature: FeatureContext = {
                value: { stringValue: 'test-command' },
                variation: 'Test Command Description',
            }

            const result = toMynahContextCommand(feature)
            assert.equal(result.command, 'test-command')
            assert.equal(result.id, 'test-command')
            assert.equal(result.description, 'Test Command Description')
        })

        it('returns empty object for undefined feature', () => {
            const result = toMynahContextCommand(undefined)
            assert.deepEqual(result, {})
        })

        it('returns empty object for feature without string value', () => {
            const feature: FeatureContext = {
                value: {},
                variation: 'Description',
            }

            const result = toMynahContextCommand(feature)
            assert.deepEqual(result, {})
        })

        it('returns empty object for feature with empty string value', () => {
            const feature: FeatureContext = {
                value: { stringValue: '' },
                variation: 'Description',
            }

            const result = toMynahContextCommand(feature)
            assert.deepEqual(result, {})
        })
    })
})
