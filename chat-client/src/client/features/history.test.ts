import { DetailedList, MynahUI } from '@aws/mynah-ui'
import { Messager } from '../messager'
import sinon = require('sinon')
import { ChatHistoryList } from './history'
import { ListConversationsResult } from '@aws/language-server-runtimes-types'
import * as assert from 'assert'
import { DetailedListSheetProps } from '@aws/mynah-ui/dist/components/detailed-list/detailed-list-sheet'

describe('history', () => {
    let mynahUi: MynahUI
    let messager: Messager
    let openDetailedListStub: sinon.SinonStub
    let chatHistoryList: ChatHistoryList

    beforeEach(() => {
        mynahUi = {
            openDetailedList: sinon.stub(),
        } as unknown as MynahUI
        openDetailedListStub = mynahUi.openDetailedList as sinon.SinonStub

        messager = {
            onListConversations: sinon.stub(),
            onConversationClick: sinon.stub(),
        } as unknown as Messager

        chatHistoryList = new ChatHistoryList(mynahUi, messager)
    })

    afterEach(() => {
        sinon.restore()
    })

    it('show opens detailed list if called the first time', () => {
        const mockParams: ListConversationsResult = {
            header: { title: 'test title' },
            list: [
                {
                    groupName: 'group',
                    icon: 'not_existing',
                    items: [
                        {
                            id: 'i1',
                            icon: 'chat',
                            description: 'desc',
                            actions: [
                                {
                                    id: 'a1',
                                    text: 'delete',
                                    icon: 'trash',
                                },
                            ],
                        },
                    ],
                },
            ],
            filterOptions: [
                {
                    id: '1',
                    type: 'textinput',
                    icon: 'search',
                },
            ],
        }

        chatHistoryList.show(mockParams)

        sinon.assert.calledOnce(openDetailedListStub)
        const arg = openDetailedListStub.getCall(0).args[0] as DetailedListSheetProps
        assert.equal(arg.detailedList.header, mockParams.header)
        assert.deepEqual(arg.detailedList.filterOptions, [
            {
                ...mockParams.filterOptions?.[0],
                autoFocus: true,
            },
        ])
        assert.deepEqual(arg.detailedList.list, [
            {
                groupName: mockParams.list?.[0].groupName,
                icon: undefined,
                children: mockParams.list?.[0].items,
            },
        ])
    })
    it('show updates detailed list if called the second time', () => {
        const mockParams: ListConversationsResult = {
            header: { title: 'test title' },
            list: [
                {
                    groupName: 'group',
                    items: [
                        {
                            id: 'i1',
                        },
                    ],
                },
            ],
        }

        const updateStub = sinon.stub()
        openDetailedListStub.returns({
            update: updateStub,
            close: sinon.stub(),
            changeTarget: sinon.stub(),
            getTargetElementId: sinon.stub(),
        })

        // First call to show
        chatHistoryList.show(mockParams)

        // Second call to show
        const updatedMockParams: ListConversationsResult = {
            list: [
                {
                    groupName: 'group',
                    items: [
                        {
                            id: 'i2',
                        },
                    ],
                },
            ],
        }
        chatHistoryList.show(updatedMockParams)

        sinon.assert.calledOnce(openDetailedListStub)
        sinon.assert.calledOnce(updateStub)
        const updateArg = updateStub.getCall(0).args[0] as DetailedList
        assert.equal(updateArg.list?.[0].children?.[0].id, updatedMockParams.list[0].items?.[0].id)
    })
    it('show opens detailed list if called after close', () => {
        const mockParams: ListConversationsResult = {
            header: { title: 'test title' },
            list: [
                {
                    groupName: 'group',
                    items: [
                        {
                            id: 'i1',
                        },
                    ],
                },
            ],
        }

        // First call to show
        chatHistoryList.show(mockParams)

        // Close the list
        chatHistoryList.close()

        // Call show again
        chatHistoryList.show(mockParams)

        sinon.assert.calledTwice(openDetailedListStub)
    })
})
