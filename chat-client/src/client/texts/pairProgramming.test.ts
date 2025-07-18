import * as assert from 'assert'
import { ChatItemType, MynahIcons } from '@aws/mynah-ui'
import {
    programmerModeCard,
    pairProgrammingPromptInput,
    pairProgrammingModeOn,
    pairProgrammingModeOff,
    testRerouteCard,
    docRerouteCard,
    devRerouteCard,
    createRerouteCard,
} from './pairProgramming'

describe('pairProgramming', () => {
    describe('programmerModeCard', () => {
        it('has correct properties', () => {
            assert.equal(programmerModeCard.type, ChatItemType.ANSWER)
            assert.equal(programmerModeCard.title, 'NEW FEATURE')
            assert.equal(programmerModeCard.messageId, 'programmerModeCardId')
            assert.equal(programmerModeCard.fullWidth, true)
            assert.equal(programmerModeCard.canBeDismissed, true)
            assert.ok(programmerModeCard.body?.includes('Amazon Q can now help'))
            assert.equal(programmerModeCard.header?.icon, 'code-block')
            assert.equal(programmerModeCard.header?.iconStatus, 'primary')
        })
    })

    describe('pairProgrammingPromptInput', () => {
        it('has correct properties', () => {
            assert.equal(pairProgrammingPromptInput.type, 'switch')
            assert.equal(pairProgrammingPromptInput.id, 'pair-programmer-mode')
            assert.equal(pairProgrammingPromptInput.tooltip, 'Turn OFF agentic coding')
            if (pairProgrammingPromptInput.type === 'switch') {
                // Type guard for switch type
                assert.equal(pairProgrammingPromptInput.alternateTooltip, 'Turn ON agentic coding')
            }
            assert.equal(pairProgrammingPromptInput.value, 'true')
            assert.equal(pairProgrammingPromptInput.icon, 'code-block')
        })
    })

    describe('pairProgrammingModeOn', () => {
        it('has correct properties', () => {
            assert.equal(pairProgrammingModeOn.type, ChatItemType.DIRECTIVE)
            assert.equal(pairProgrammingModeOn.contentHorizontalAlignment, 'center')
            assert.equal(pairProgrammingModeOn.fullWidth, true)
            assert.equal(pairProgrammingModeOn.body, 'Agentic coding - ON')
        })
    })

    describe('pairProgrammingModeOff', () => {
        it('has correct properties', () => {
            assert.equal(pairProgrammingModeOff.type, ChatItemType.DIRECTIVE)
            assert.equal(pairProgrammingModeOff.contentHorizontalAlignment, 'center')
            assert.equal(pairProgrammingModeOff.fullWidth, true)
            assert.equal(pairProgrammingModeOff.body, 'Agentic coding - OFF')
        })
    })

    describe('testRerouteCard', () => {
        it('has correct properties', () => {
            assert.equal(testRerouteCard.type, ChatItemType.ANSWER)
            assert.equal(testRerouteCard.border, true)
            assert.equal(testRerouteCard.header?.padding, true)
            assert.equal(testRerouteCard.header?.iconForegroundStatus, 'warning')
            assert.equal(testRerouteCard.header?.icon, MynahIcons.INFO)
            assert.ok(testRerouteCard.header?.body?.includes('generate unit tests'))
            assert.ok(testRerouteCard.body?.includes("You don't need to explicitly use /test"))
        })
    })

    describe('docRerouteCard', () => {
        it('has correct properties', () => {
            assert.equal(docRerouteCard.type, ChatItemType.ANSWER)
            assert.equal(docRerouteCard.border, true)
            assert.equal(docRerouteCard.header?.padding, true)
            assert.equal(docRerouteCard.header?.iconForegroundStatus, 'warning')
            assert.equal(docRerouteCard.header?.icon, MynahIcons.INFO)
            assert.ok(docRerouteCard.header?.body?.includes('generate documentation'))
            assert.ok(docRerouteCard.body?.includes("You don't need to explicitly use /doc"))
        })
    })

    describe('devRerouteCard', () => {
        it('has correct properties', () => {
            assert.equal(devRerouteCard.type, ChatItemType.ANSWER)
            assert.equal(devRerouteCard.border, true)
            assert.equal(devRerouteCard.header?.padding, true)
            assert.equal(devRerouteCard.header?.iconForegroundStatus, 'warning')
            assert.equal(devRerouteCard.header?.icon, MynahIcons.INFO)
            assert.ok(devRerouteCard.header?.body?.includes('generate code'))
            assert.ok(devRerouteCard.body?.includes("You don't need to explicitly use /dev"))
        })
    })

    describe('createRerouteCard', () => {
        it('returns testRerouteCard for /test command', () => {
            const result = createRerouteCard('/test')
            assert.deepEqual(result, testRerouteCard)
        })

        it('returns docRerouteCard for /doc command', () => {
            const result = createRerouteCard('/doc')
            assert.deepEqual(result, docRerouteCard)
        })

        it('returns devRerouteCard for /dev command', () => {
            const result = createRerouteCard('/dev')
            assert.deepEqual(result, devRerouteCard)
        })

        it('returns devRerouteCard for unknown command', () => {
            const result = createRerouteCard('/unknown')
            assert.deepEqual(result, devRerouteCard)
        })

        it('returns devRerouteCard for empty string', () => {
            const result = createRerouteCard('')
            assert.deepEqual(result, devRerouteCard)
        })
    })
})
