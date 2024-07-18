import { Server } from '@aws/language-server-runtimes/server-interface'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { TextDocumentItem } from 'vscode-languageserver-types'
import { PartiQLServerFactory } from './language-server'
import { createPartiQLLanguageService } from './language-service'

// Here we test that the language service doValidation handler gets called at
// the expected events. Tests that the service does what is expected can be found
// in the service test file.
describe('PartiQL Server', () => {
    let features: TestFeatures
    let server: Server

    let service: ReturnType<typeof createPartiQLLanguageService>
    let validationSpy: jest.SpyInstance
    let loggingSpy: jest.SpyInstance

    beforeEach(async () => {
        service = createPartiQLLanguageService()

        // Spy on the doValidation handler of the lanaguage service
        validationSpy = jest.spyOn(service, 'doValidation')

        server = PartiQLServerFactory(service)

        // Initialize the features, but don't start server yet
        features = new TestFeatures()

        // Spy on the log handler of the logging feature
        loggingSpy = jest.spyOn(features.logging, 'log')

        // Start the server and open a document
        await features.start(server)
        features.openDocument(validationFile)
    })

    afterEach(() => {
        jest.clearAllMocks()
        features.dispose()
    })

    it('should validate when change document', async () => {
        expect(validationSpy).toHaveBeenCalledTimes(0)
        await features.doChangeTextDocument({
            textDocument: validationFile,
            contentChanges: [],
        })
        expect(validationSpy).toHaveBeenCalledTimes(1)
    })

    it('should validate when open document', async () => {
        expect(validationSpy).toHaveBeenCalledTimes(0)
        await features.doOpenTextDocument({
            textDocument: validationOpenFileItem,
        })
        expect(validationSpy).toHaveBeenCalledTimes(1)
    })

    it('should log when receiving change notification for unknown file', async () => {
        await features.doChangeTextDocument({
            textDocument: unknownValidationFile,
            contentChanges: [],
        })
        expect(loggingSpy).toHaveBeenCalledWith('textDocument [file:///testUnknownPartiQLvalidation.json] not found')
    })
})

const validationContent = `SELECT FROM env`
const validationFile = TextDocument.create('file:///testPartiQLvalidation.json', 'partiql', 1, validationContent)
const validationOpenFileItem = TextDocumentItem.create(
    'file:///testPartiQLnewfilevalidation.json',
    'partiql',
    1,
    validationContent
)
const unknownValidationFile = TextDocument.create(
    'file:///testUnknownPartiQLvalidation.json',
    'partiql',
    1,
    validationContent
)

// Describes a test suite for testing the PartiQL Language Service's
// ability to respond semantic tokens request.
describe('PartiQL Language Service - Semantic Tokens', () => {
    // Declare variables for the service and a mock document.
    let service: ReturnType<typeof createPartiQLLanguageService>
    let mockDocument: TextDocument

    beforeEach(() => {
        // Initializes the PartiQL language service.
        service = createPartiQLLanguageService()

        // Creates a mock TextDocument representing a PartiQL script.
        // This is to simulate a user editing a document in an IDE.
        mockDocument = TextDocument.create(
            'file:///example.partiql', // URI of the document
            'partiql', // Language identifier
            1, // Version number of the document
            "SELECT * FROM my_table WHERE column = 'value'" // Content of the document
        )

        // Mocks the getText method of the TextDocument to always return a specific query.
        // This ensures consistent results when the document's content is retrieved in the tests.
        jest.spyOn(mockDocument, 'getText').mockReturnValue("SELECT * FROM my_table WHERE column = 'value'")
    })

    // Defines a test case to verify if semantic tokens are generated correctly when a request is received.
    it('should generate semantic tokens when receive request', async () => {
        // Calls the doSemanticTokens method which should analyze the text document and produce semantic tokens.
        const tokens = await service.doSemanticTokens(mockDocument)

        // Checks that tokens are defined after the function call, ensuring the method produces an output.
        expect(tokens).toBeDefined()

        // Confirm the document's text was accessed during token generation.
        expect(mockDocument.getText).toHaveBeenCalled()
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })
})
