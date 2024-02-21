import * as chai from 'chai'
import { expect } from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { beforeEach, describe, it } from 'node:test'
import { TextDocument, TextEdit } from 'vscode-languageserver-textdocument'
import { CompletionList, Diagnostic, FormattingOptions, Hover, Position, Range } from 'vscode-languageserver-types'
import { AwsLanguageService } from './awsLanguageService'
import { MutuallyExclusiveLanguageService } from './mutuallyExclusiveLanguageService'

const knownLanguageId = 'test-yaml'
const diagnosticMessage = 'test diagnostic message'

export class TestLanguageService implements AwsLanguageService {
    public isSupported(document: TextDocument): boolean {
        return document.languageId == knownLanguageId
    }

    public doValidation(textDocument: TextDocument): PromiseLike<Diagnostic[]> {
        const testRange = Range.create(textDocument.positionAt(0), textDocument.positionAt(1))
        const testDiagnostic = Diagnostic.create(testRange, diagnosticMessage)
        return Promise.resolve([testDiagnostic])
    }

    public doComplete(textDocument: TextDocument, position: Position): PromiseLike<CompletionList | null> {
        return Promise.resolve(null)
    }

    public doHover(textDocument: TextDocument, position: Position): PromiseLike<Hover | null> {
        return Promise.resolve(null)
    }

    public format(textDocument: TextDocument, range: Range, options: FormattingOptions): TextEdit[] {
        return []
    }
}

chai.use(chaiAsPromised)

describe('Test mutuallyExclusiveLanguageService', async () => {
    let languageService: AwsLanguageService

    beforeEach(async () => {
        languageService = new MutuallyExclusiveLanguageService([new TestLanguageService()])
    })

    it('languageId is unknown, isSupported, should recognize', async () => {
        const testTextDocument = TextDocument.create('test-uri', 'unknown-language-id', 1, 'some content')
        expect(languageService.isSupported(testTextDocument)).to.equal(true)
    })

    it('languageId is known, isSupported, should recognize', async () => {
        const testTextDocument = TextDocument.create('test-uri', knownLanguageId, 1, 'some content')
        expect(languageService.isSupported(testTextDocument)).to.equal(true)
    })

    it('languageId is unknown, validate, should return empty diagnostic list', async () => {
        const testTextDocument = TextDocument.create('test-uri', 'unknown-language-id', 1, 'some content')
        const actualResult = await languageService.doValidation(testTextDocument)
        expect(actualResult).to.be.empty
    })

    it('languageId is known, validate, should return 1 diagnostic', async () => {
        const testTextDocument = TextDocument.create('test-uri', knownLanguageId, 1, 'some content')
        const actualResult = await languageService.doValidation(testTextDocument)

        expect(actualResult).to.have.length(1)
        expect(actualResult[0].message).to.be.equal(diagnosticMessage)
    })
})
