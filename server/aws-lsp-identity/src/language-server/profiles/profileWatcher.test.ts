// eslint-disable-next-line @typescript-eslint/no-require-imports
import mock = require('mock-fs')
import { ProfileData, ProfileStore } from './profileService'
import { Logging, Telemetry } from '@aws/language-server-runtimes/server-interface'
import { SinonSpy, spy } from 'sinon'
import { StubbedInstance, stubInterface } from 'ts-sinon'
import { use } from 'chai'
import { Observability } from '@aws/lsp-core'
import { ProfileWatcher } from './profileWatcher'

// eslint-disable-next-line @typescript-eslint/no-require-imports
use(require('chai-as-promised'))

let sut: ProfileWatcher

let store: StubbedInstance<ProfileStore>
let sendProfileChangedSpy: SinonSpy
let observability: StubbedInstance<Observability>

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

        sut = new ProfileWatcher(store, sendProfileChangedSpy, observability)
    })

    afterEach(() => {
        mock.restore()
    })

    it('should watch without errors when called multiple times', () => {
        sut.watch()
        sut.watch()
    })

    it('should unwatch without errors when called multiple times', () => {
        sut.watch()
        sut.watch()
    })

    // TODO: figure out how to mock fs.watch and setTimeout for notification calls
})
