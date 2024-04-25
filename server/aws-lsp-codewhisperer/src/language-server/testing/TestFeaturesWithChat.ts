import { Chat } from '@aws/language-server-runtimes/server-interface'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { stubInterface } from 'ts-sinon'

type EventHandlerType<Key extends keyof Chat> = Parameters<Chat[Key]>[0]
type EventHandlerParameters<Key extends keyof Chat> = Parameters<EventHandlerType<Key>>

// TODO: Move to runtime package if this is okay
export class TestFeaturesWithChat extends TestFeatures {
    chatHandlerMap: { [key in keyof Chat]?: Parameters<Chat[key]>[0] }
    constructor() {
        super()

        this.chatHandlerMap = {}

        /**
         * Lanaguge servers registers callbacks like this: chat.onEndChat(callback)
         * so to have access to each of the callback we need to store them in a map
         *
         * The proxy object here:
         *
         * eliminates the need to define each function individually.
         * automatically saves callback in the chatHandlerMap by the custom get function
         */
        this.chat = new Proxy(stubInterface(), {
            get: (_target, prop) => {
                return (callback: any) => {
                    this.chatHandlerMap[prop as keyof Chat] = callback
                }
            },
        })
    }

    doChatPrompt(...params: EventHandlerParameters<'onChatPrompt'>) {
        return this.chatHandlerMap.onChatPrompt?.(...params)
    }

    doTabAdd(...params: EventHandlerParameters<'onTabAdd'>) {
        return this.chatHandlerMap.onTabAdd?.(...params)
    }

    doTabRemove(...params: EventHandlerParameters<'onTabRemove'>) {
        return this.chatHandlerMap.onTabRemove?.(...params)
    }

    doEndChat(...params: EventHandlerParameters<'onEndChat'>) {
        return this.chatHandlerMap.onEndChat?.(...params)
    }
}
