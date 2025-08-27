import { ChatHistory } from '../features/history'
import { TabFactory } from './tabFactory'
import * as assert from 'assert'
import { pairProgrammingPromptInput } from '../texts/pairProgramming'
import { modelSelection } from '../texts/modelSelection'

describe('tabFactory', () => {
    describe('getDefaultTabData', () => {
        const defaultData = {
            tabTitle: 'Chat',
            promptInputInfo: 'Amazon Q Developer uses generative AI.',
            tabBarButtons: [
                {
                    id: '1',
                },
            ],
        }
        it('returns default tab data if no updates', () => {
            const tabFactory = new TabFactory(defaultData)
            const result = tabFactory.getDefaultTabData()

            assert.deepEqual(result, defaultData)
        })

        it('enabling history adds history tab bar button to default tab bar buttons', () => {
            const tabFactory = new TabFactory(defaultData)
            tabFactory.enableHistory()
            const result = tabFactory.getDefaultTabData()

            const expected = {
                ...defaultData,
                tabBarButtons: [
                    ...defaultData.tabBarButtons,
                    {
                        description: 'View chat history',
                        icon: 'history',
                        id: ChatHistory.TabBarButtonId,
                    },
                ],
            }
            assert.deepEqual(result, expected)
        })

        it('enabling history sets history tab bar button', () => {
            const data = {
                tabTitle: 'Chat',
            }
            const tabFactory = new TabFactory(data)
            tabFactory.enableHistory()
            const result = tabFactory.getDefaultTabData()

            const expected = {
                ...data,
                tabBarButtons: [
                    {
                        description: 'View chat history',
                        icon: 'history',
                        id: ChatHistory.TabBarButtonId,
                    },
                ],
            }
            assert.deepEqual(result, expected)
        })

        it('enabling export sets export tab bar button', () => {
            const data = {
                tabTitle: 'Chat',
            }
            const tabFactory = new TabFactory(data)
            tabFactory.enableExport()
            const result = tabFactory.getDefaultTabData()

            const expected = {
                ...data,
                tabBarButtons: [
                    {
                        description: 'Export chat',
                        icon: 'external',
                        id: 'export',
                    },
                ],
            }
            assert.deepEqual(result, expected)
        })
    })

    describe('createTab', () => {
        it('should include model selection when agentic mode and model selection are enabled', () => {
            const tabFactory = new TabFactory({})
            tabFactory.enableAgenticMode()
            tabFactory.enableModelSelection()

            const result = tabFactory.createTab(false)

            assert.deepStrictEqual(result.promptInputOptions, [pairProgrammingPromptInput, modelSelection])
        })

        it('should not include model selection when only agentic mode is enabled', () => {
            const tabFactory = new TabFactory({})
            tabFactory.enableAgenticMode()

            const result = tabFactory.createTab(false)

            assert.deepStrictEqual(result.promptInputOptions, [pairProgrammingPromptInput])
        })

        it('should not include any prompt input options when neither agentic mode nor model selection are enabled', () => {
            const tabFactory = new TabFactory({})

            const result = tabFactory.createTab(false)

            assert.deepStrictEqual(result.promptInputOptions, [])
        })

        it('should not include any prompt input options when only model selection is enabled but agentic mode is not', () => {
            const tabFactory = new TabFactory({})
            tabFactory.enableModelSelection()

            const result = tabFactory.createTab(false)

            assert.deepStrictEqual(result.promptInputOptions, [])
        })
    })
})
