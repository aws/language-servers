import { AsyncEvent } from './asyncEvent'
import { expect } from 'chai'

describe('AsyncEvent', () => {
    it('Handlers get called, but not after removal', async () => {
        const sut = new AsyncEvent<string>()

        const actualSender = {}
        let actualEventArg: string

        let handler1Called: boolean = false
        sut.add(async (sender: object, e: string) => {
            expect(sender).to.equal(actualSender)
            expect(e).to.equal(actualEventArg)
            handler1Called = true
        })

        let handler2Called: boolean = false
        const handler2 = async (sender: object, e: string) => {
            expect(sender).to.equal(actualSender)
            expect(e).to.equal(actualEventArg)
            handler2Called = true
        }
        sut.add(handler2)

        await sut.raise(actualSender, (actualEventArg = 'test1'))

        expect(handler1Called).to.be.true
        expect(handler2Called).to.be.true

        handler1Called = false
        handler2Called = false

        expect(handler1Called).to.be.false
        expect(handler2Called).to.be.false

        sut.remove(handler2)

        await sut.raise(actualSender, (actualEventArg = 'test2'))

        expect(handler1Called).to.be.true
        expect(handler2Called).to.be.false
    })
})
