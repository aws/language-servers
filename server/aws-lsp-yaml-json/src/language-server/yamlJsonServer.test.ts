import { Server } from '@aws/language-server-runtimes/server-interface'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { AwsLanguageService } from '@aws/lsp-core/out/base'
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon'
import { CancellationToken, FormattingOptions } from 'vscode-languageserver'
import {
    JSON_COMPLETION_FILE,
    JSON_COMPLETION_POSITION,
    JSON_VALIDATION_FILE,
    JSON_VALIDATION_OPEN_FILE,
    JSON_VALIDATION_OPEN_FILE_ITEM,
    JSON_HOVER_FILE,
    JSON_HOVER_POSITION,
    JSON_FORMAT_FILE,
    JSON_FORMAT_RANGE,
} from './testUtils'
import { YamlJsonServerFactory } from './yamlJsonServer'
export { YamlJsonServerFactory } from './yamlJsonServer'

describe('YamlJson Server', () => {
    let features: TestFeatures
    let server: Server

    // TODO: write tests with real YAML/JSON service
    let service: StubbedInstance<AwsLanguageService>

    beforeEach(async () => {
        service = stubInterface<AwsLanguageService>()

        server = YamlJsonServerFactory(service)

        // Initialize the features, but don't start server yet
        features = new TestFeatures()

        // Start the server and open a document
        await features.start(server)

        features.openDocument(JSON_COMPLETION_FILE)
        features.openDocument(JSON_VALIDATION_FILE)
        features.openDocument(JSON_HOVER_FILE)
        features.openDocument(JSON_FORMAT_FILE)
    })

    afterEach(() => {
        features.dispose()
    })

    it('should validate when change document', async () => {
        await features.doChangeTextDocument({
            textDocument: JSON_VALIDATION_FILE,
            contentChanges: [],
        })

        sinon.assert.calledOnceWithExactly(service.doValidation, JSON_VALIDATION_FILE)
    })

    it('should validate when open document', async () => {
        await features.doOpenTextDocument({
            textDocument: JSON_VALIDATION_OPEN_FILE_ITEM,
        })

        sinon.assert.calledOnceWithExactly(service.doValidation, JSON_VALIDATION_OPEN_FILE)
    })

    it('should complete', async () => {
        await features.doCompletion(
            { textDocument: JSON_COMPLETION_FILE, position: JSON_COMPLETION_POSITION },
            CancellationToken.None
        )

        sinon.assert.calledOnceWithExactly(service.doComplete, JSON_COMPLETION_FILE, JSON_COMPLETION_POSITION)
    })

    it('should hover', async () => {
        await features.doHover({ textDocument: JSON_HOVER_FILE, position: JSON_HOVER_POSITION }, CancellationToken.None)

        sinon.assert.calledOnceWithExactly(service.doHover, JSON_HOVER_FILE, JSON_HOVER_POSITION)
    })

    it('should format', async () => {
        await features.doFormat(
            { textDocument: JSON_FORMAT_FILE, options: {} as FormattingOptions },
            CancellationToken.None
        )

        sinon.assert.calledOnceWithExactly(service.format, JSON_FORMAT_FILE, JSON_FORMAT_RANGE, {} as FormattingOptions)
    })
})
