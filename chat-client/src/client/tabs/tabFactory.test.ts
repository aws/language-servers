import { ChatHistory } from '../features/history'
import { TabFactory } from './tabFactory'
import * as assert from 'assert'

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
})
