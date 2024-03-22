import { Server } from '@aws/language-server-runtimes'
import { TestFeatures } from '@aws/language-server-runtimes/out/testing'
import { AwsLanguageService } from '@aws/lsp-core/out/base'
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon'
import { CancellationToken } from 'vscode-languageserver'
import { JSON_COMPLETION_FILE, JSON_COMPLETION_POSITION, JSON_VALIDATION_FILE } from './testUtils'
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
    })

    afterEach(() => {
        features.dispose()
    })

    it('should validate', async () => {
        features.workspace.getTextDocument.returns(Promise.resolve(JSON_COMPLETION_FILE))

        await features.doChangeTextDocument({
            textDocument: JSON_VALIDATION_FILE,
            contentChanges: [],
        })

        sinon.assert.calledOnceWithExactly(service.doValidation, JSON_COMPLETION_FILE)
    })

    it('should complete', async () => {
        features.workspace.getTextDocument.returns(Promise.resolve(JSON_COMPLETION_FILE))

        await features.doCompletion(
            { textDocument: JSON_COMPLETION_FILE, position: JSON_COMPLETION_POSITION },
            CancellationToken.None
        )

        sinon.assert.calledOnceWithExactly(service.doComplete, JSON_COMPLETION_FILE, JSON_COMPLETION_POSITION)
    })
})
