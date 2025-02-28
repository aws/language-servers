import { expect, use } from 'chai'
import { StubbedInstance, stubInterface } from 'ts-sinon'
import { Observability } from '@aws/lsp-core'
import { Logging, Telemetry } from '@aws/language-server-runtimes/server-interface'
import { restore } from 'sinon'

// eslint-disable-next-line @typescript-eslint/no-var-requires
use(require('chai-as-promised'))

let observability: StubbedInstance<Observability>

describe('', () => {
    beforeEach(() => {
        observability = stubInterface<Observability>()
        observability.logging = stubInterface<Logging>()
        observability.telemetry = stubInterface<Telemetry>()
    })

    afterEach(() => {
        restore()
    })

    it('', () => {
        expect(true).to.be.true
    })
})
