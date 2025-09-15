import * as chai from 'chai'
import { expect } from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { beforeEach, describe, it } from 'node:test'
import { TextDocument } from 'vscode-languageserver-textdocument'
import {
    CompletionItem,
    CompletionList,
    Diagnostic,
    FormattingOptions,
    Hover,
    MarkupContent,
    MarkupKind,
    Position,
    Range,
    TextEdit,
} from 'vscode-languageserver-types'
import { AwsLanguageService } from './awsLanguageService'
import { MutuallyExclusiveLanguageService } from './mutuallyExclusiveLanguageService'

const knownLanguageId = 'test-yaml'
const diagnosticMessage = 'test diagnostic message'
const completion = 'test completion'
const formatText = 'test format text'
const hoverValue = 'test hover value'

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
        const completionList = CompletionList.create([CompletionItem.create(completion)], true)
        return Promise.resolve(completionList)
    }

    public doHover(textDocument: TextDocument, position: Position): PromiseLike<Hover | null> {
        const hover = {
            contents: {
                kind: MarkupKind.PlainText,
                value: hoverValue,
            },
        }
        return Promise.resolve(hover)
    }

    public format(textDocument: TextDocument, range: Range, options: FormattingOptions): TextEdit[] {
        const textEdits = [{ range: Range.create(Position.create(0, 0), Position.create(1, 1)), newText: formatText }]
        return textEdits
    }
}

const doubleSupportCompletion = 'double support test completion'

export class DoubleSupportTestService extends TestLanguageService {
    public override doComplete(textDocument: TextDocument, position: Position): PromiseLike<CompletionList | null> {
        const completionList = CompletionList.create([CompletionItem.create(doubleSupportCompletion)], true)
        return Promise.resolve(completionList)
    }
}

chai.use(chaiAsPromised)

describe('Test mutuallyExclusiveLanguageService', async () => {
    let languageService: AwsLanguageService

    beforeEach(async () => {
        languageService = new MutuallyExclusiveLanguageService([new TestLanguageService()])
    })

    it('2 services support language, should return 1 result', async () => {
        languageService = new MutuallyExclusiveLanguageService([
            new DoubleSupportTestService(),
            new TestLanguageService(),
        ])

        const testTextDocument = TextDocument.create('test-uri', knownLanguageId, 1, 'some content')
        const actualResult = await languageService.doComplete(testTextDocument, Position.create(0, 0))

        expect(actualResult?.items).to.have.length(1)
        expect(actualResult?.items[0].label).to.be.equal(doubleSupportCompletion)
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

    it('languageId is unknown, complete, should return null', async () => {
        const testTextDocument = TextDocument.create('test-uri', 'unknown-language-id', 1, 'some content')
        const actualResult = await languageService.doComplete(testTextDocument, Position.create(0, 0))

        expect(actualResult).to.be.null
    })

    it('languageId is known, complete, should return 1 completion', async () => {
        const testTextDocument = TextDocument.create('test-uri', knownLanguageId, 1, 'some content')
        const actualResult = await languageService.doComplete(testTextDocument, Position.create(0, 0))

        expect(actualResult?.items).to.have.length(1)
        expect(actualResult?.items[0].label).to.be.equal(completion)
    })

    it('languageId is unknown, format, should return null', async () => {
        const testTextDocument = TextDocument.create('test-uri', 'unknown-language-id', 1, 'some content')
        const actualResult = await languageService.doComplete(testTextDocument, Position.create(0, 0))

        expect(actualResult).to.be.null
    })

    it('languageId is known, format, should return 1 format', () => {
        const testTextDocument = TextDocument.create('test-uri', knownLanguageId, 1, 'some content')
        const actualResult = languageService.format(
            testTextDocument,
            Range.create(Position.create(0, 0), Position.create(1, 1)),
            {
                tabSize: 0,
                insertSpaces: false,
            }
        )

        expect(actualResult).to.have.length(1)
        expect(actualResult[0].newText).to.be.equal(formatText)
    })

    it('languageId is unknown, hover, should return null', async () => {
        const testTextDocument = TextDocument.create('test-uri', 'unknown-language-id', 1, 'some content')
        const actualResult = await languageService.doHover(testTextDocument, Position.create(0, 0))

        expect(actualResult).to.be.null
    })

    it('languageId is known, hover, should return 1 hover', async () => {
        const testTextDocument = TextDocument.create('test-uri', knownLanguageId, 1, 'some content')
        const actualResult = await languageService.doHover(testTextDocument, Position.create(0, 0))

        const actualHover = actualResult?.contents.valueOf() as MarkupContent

        expect(actualHover.kind).to.be.equal('plaintext')
        expect(actualHover.value).to.be.equal(hoverValue)
    })
})
