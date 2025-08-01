// eslint-disable-next-line @typescript-eslint/no-require-imports
import mock = require('mock-fs')
import { ProfileData, ProfileStore } from './profileService'
import { Logging, Telemetry } from '@aws/language-server-runtimes/server-interface'
import { SinonSpy, spy, SinonFakeTimers, useFakeTimers } from 'sinon'
import { StubbedInstance, stubInterface } from 'ts-sinon'
import { expect, use } from 'chai'
import { Observability } from '@aws/lsp-core'
import { ProfileWatcher } from './profileWatcher'

// eslint-disable-next-line @typescript-eslint/no-require-imports
use(require('chai-as-promised'))

let sut: ProfileWatcher

let store: StubbedInstance<ProfileStore>
let sendProfileChangedSpy: SinonSpy
let observability: StubbedInstance<Observability>
let clock: SinonFakeTimers

describe('ProfileWatcher', async () => {
    beforeEach(() => {
        store = stubInterface<ProfileStore>({
            load: Promise.resolve({
                profiles: [],
                ssoSessions: [],
            } satisfies ProfileData),
            save: Promise.resolve(),
        })

        sendProfileChangedSpy = spy()

        observability = stubInterface<Observability>()
        observability.logging = stubInterface<Logging>()
        observability.telemetry = stubInterface<Telemetry>()

        clock = useFakeTimers()

        sut = new ProfileWatcher(store, sendProfileChangedSpy, observability)
    })

    afterEach(() => {
        mock.restore()
        clock.restore()
    })

    it('should send notification when file is changed', async () => {
        // mock-fs does not support fs.watch, so we are not testing watch() directly
        // https://github.com/tschaub/mock-fs/issues/246
        sut.onFileChange()
        // Wait for debounce timer and its async callback to finish
        clock.runAll()
        await Promise.resolve()
        expect(sendProfileChangedSpy.calledOnce).to.be.true
    })

    it('should only send 1 notification after multiple file changes over short duration', async () => {
        sut.onFileChange()
        clock.tick(100)
        sut.onFileChange()
        clock.tick(100)
        sut.onFileChange()

        clock.runAll()
        await Promise.resolve()
        expect(sendProfileChangedSpy.calledOnce).to.be.true
    })

    it('should watch without errors when called multiple times', () => {
        sut.watch()
        sut.watch()
    })

    it('should unwatch without errors when called multiple times', () => {
        sut.unwatch()
        sut.unwatch()
    })
})
