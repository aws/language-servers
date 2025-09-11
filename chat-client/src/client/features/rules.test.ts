import { MynahUI, DetailedListItem } from '@aws/mynah-ui'
import { Messager } from '../messager'
import * as sinon from 'sinon'
import { RulesList, ContextRule, convertRulesListToDetailedListGroup } from './rules'
import { ListRulesResult, RulesFolder } from '@aws/language-server-runtimes-types'
import * as assert from 'assert'

describe('rules', () => {
    let mynahUi: MynahUI
    let messager: Messager
    let openTopBarButtonOverlayStub: sinon.SinonStub
    let showCustomFormStub: sinon.SinonStub
    let rulesList: RulesList

    beforeEach(() => {
        mynahUi = {
            openTopBarButtonOverlay: sinon.stub(),
            showCustomForm: sinon.stub(),
        } as unknown as MynahUI
        openTopBarButtonOverlayStub = mynahUi.openTopBarButtonOverlay as sinon.SinonStub
        showCustomFormStub = mynahUi.showCustomForm as sinon.SinonStub

        messager = {
            onRuleClick: sinon.stub(),
        } as unknown as Messager

        rulesList = new RulesList(mynahUi, messager)
    })

    afterEach(() => {
        sinon.restore()
    })

    describe('showLoading', () => {
        it('opens top bar button overlay with loading message', () => {
            const mockOverlay = {
                update: sinon.stub(),
                close: sinon.stub(),
            }
            openTopBarButtonOverlayStub.returns(mockOverlay)

            rulesList.showLoading('test-tab-id')

            sinon.assert.calledOnce(openTopBarButtonOverlayStub)
            const arg = openTopBarButtonOverlayStub.getCall(0).args[0]
            assert.equal(arg.tabId, 'test-tab-id')
            assert.equal(arg.topBarButtonOverlay.list[0].groupName, 'Loading rules...')
            assert.equal(arg.topBarButtonOverlay.selectable, false)
        })
    })

    describe('show', () => {
        it('opens top bar button overlay when called first time', () => {
            const mockParams: ListRulesResult = {
                tabId: 'test-tab-id',
                rules: [
                    {
                        folderName: 'test-folder',
                        active: true,
                        rules: [
                            {
                                id: 'rule-1',
                                name: 'Test Rule',
                                active: true,
                            },
                        ],
                    },
                ],
                filterOptions: [
                    {
                        id: 'filter-1',
                        type: 'textinput',
                        icon: 'search',
                    },
                ],
            }

            const mockOverlay = {
                update: sinon.stub(),
                close: sinon.stub(),
            }
            openTopBarButtonOverlayStub.returns(mockOverlay)

            rulesList.show(mockParams)

            sinon.assert.calledOnce(openTopBarButtonOverlayStub)
            const arg = openTopBarButtonOverlayStub.getCall(0).args[0]
            assert.equal(arg.tabId, 'test-tab-id')
            assert.equal(arg.topBarButtonOverlay.selectable, 'clickable')
        })

        it('updates existing overlay when called second time', () => {
            const mockParams: ListRulesResult = {
                tabId: 'test-tab-id',
                rules: [],
            }

            const mockOverlay = {
                update: sinon.stub(),
                close: sinon.stub(),
            }
            openTopBarButtonOverlayStub.returns(mockOverlay)

            // First call
            rulesList.showLoading('test-tab-id')

            // Second call
            rulesList.show(mockParams)

            sinon.assert.calledOnce(mockOverlay.update)
        })
    })

    describe('rule click handling', () => {
        let mockOverlay: ReturnType<MynahUI['openTopBarButtonOverlay']>
        let onItemClick: (item: DetailedListItem) => void

        beforeEach(() => {
            mockOverlay = {
                update: sinon.stub(),
                close: sinon.stub(),
            }
            openTopBarButtonOverlayStub.returns(mockOverlay)

            rulesList.showLoading('test-tab-id')
            onItemClick = openTopBarButtonOverlayStub.getCall(0).args[0].events.onItemClick
        })

        it('shows custom form when create rule is clicked', () => {
            const createRuleItem: DetailedListItem = {
                id: ContextRule.CreateRuleId,
                description: 'Create a new rule',
            }

            onItemClick(createRuleItem)

            sinon.assert.calledOnce(showCustomFormStub)
            const formArgs = showCustomFormStub.getCall(0).args
            assert.equal(formArgs[0], 'test-tab-id')
            assert.equal(formArgs[1][0].id, ContextRule.RuleNameFieldId)
            assert.equal(formArgs[2][0].id, ContextRule.CancelButtonId)
            assert.equal(formArgs[2][1].id, ContextRule.SubmitButtonId)
        })

        it('calls messager when regular rule is clicked', () => {
            const ruleItem: DetailedListItem = {
                id: 'test-rule-id',
                description: 'Test Rule',
            }

            onItemClick(ruleItem)

            sinon.assert.calledOnce(messager.onRuleClick as sinon.SinonStub)
            const callArgs = (messager.onRuleClick as sinon.SinonStub).getCall(0).args[0]
            assert.equal(callArgs.tabId, 'test-tab-id')
            assert.equal(callArgs.type, 'rule')
            assert.equal(callArgs.id, 'test-rule-id')
        })

        it('does nothing when item has no id', () => {
            const itemWithoutId: DetailedListItem = {
                description: 'Item without ID',
            }

            onItemClick(itemWithoutId)

            sinon.assert.notCalled(messager.onRuleClick as sinon.SinonStub)
            sinon.assert.notCalled(showCustomFormStub)
        })
    })

    describe('folder click handling', () => {
        it('calls messager when folder is clicked', () => {
            const mockOverlay = {
                update: sinon.stub(),
                close: sinon.stub(),
            }
            openTopBarButtonOverlayStub.returns(mockOverlay)

            rulesList.showLoading('test-tab-id')
            const onGroupClick = openTopBarButtonOverlayStub.getCall(0).args[0].events.onGroupClick

            onGroupClick('test-folder')

            sinon.assert.calledOnce(messager.onRuleClick as sinon.SinonStub)
            const callArgs = (messager.onRuleClick as sinon.SinonStub).getCall(0).args[0]
            assert.equal(callArgs.tabId, 'test-tab-id')
            assert.equal(callArgs.type, 'folder')
            assert.equal(callArgs.id, 'test-folder')
        })
    })

    describe('keyboard handling', () => {
        it('closes overlay when Escape is pressed', () => {
            const mockOverlay = {
                update: sinon.stub(),
                close: sinon.stub(),
            }
            openTopBarButtonOverlayStub.returns(mockOverlay)

            rulesList.showLoading('test-tab-id')
            const onKeyPress = openTopBarButtonOverlayStub.getCall(0).args[0].events.onKeyPress

            const escapeEvent = { key: 'Escape' } as KeyboardEvent
            onKeyPress(escapeEvent)

            sinon.assert.calledOnce(mockOverlay.close)
        })

        it('does nothing when other keys are pressed', () => {
            const mockOverlay = {
                update: sinon.stub(),
                close: sinon.stub(),
            }
            openTopBarButtonOverlayStub.returns(mockOverlay)

            rulesList.showLoading('test-tab-id')
            const onKeyPress = openTopBarButtonOverlayStub.getCall(0).args[0].events.onKeyPress

            const enterEvent = { key: 'Enter' } as KeyboardEvent
            onKeyPress(enterEvent)

            sinon.assert.notCalled(mockOverlay.close)
        })
    })

    describe('close', () => {
        it('closes the overlay', () => {
            const mockOverlay = {
                update: sinon.stub(),
                close: sinon.stub(),
            }
            openTopBarButtonOverlayStub.returns(mockOverlay)

            rulesList.showLoading('test-tab-id')
            rulesList.close()

            sinon.assert.calledOnce(mockOverlay.close)
        })
    })

    describe('convertRulesListToDetailedListGroup', () => {
        it('converts rules folder to detailed list group', () => {
            const rulesFolder: RulesFolder[] = [
                {
                    folderName: 'test-folder',
                    active: true,
                    rules: [
                        {
                            id: 'rule-1',
                            name: 'Test Rule 1',
                            active: true,
                        },
                        {
                            id: 'rule-2',
                            name: 'Test Rule 2',
                            active: false,
                        },
                    ],
                },
                {
                    folderName: 'inactive-folder',
                    active: 'indeterminate',
                    rules: [],
                },
            ]

            const result = convertRulesListToDetailedListGroup(rulesFolder)

            assert.equal(result.length, 3) // 2 folders + create rule group
            assert.equal(result[0].groupName, 'test-folder')
            assert.equal(result[0].children?.length, 2)
            assert.equal(result[0].children?.[0].id, 'rule-1')
            assert.equal(result[0].children?.[0].description, 'Test Rule 1')
            assert.equal(result[1].groupName, 'inactive-folder')
            assert.equal(result[1].children?.length, 0)
            assert.equal(result[2].children?.[0].id, ContextRule.CreateRuleId)
        })

        it('handles empty rules array', () => {
            const result = convertRulesListToDetailedListGroup([])

            assert.equal(result.length, 1) // Only create rule group
            assert.equal(result[0].children?.[0].id, ContextRule.CreateRuleId)
        })
    })
})
