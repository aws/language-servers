import { TextDocument } from 'vscode-languageserver-textdocument'
import { DocumentParser } from '../../../utils/parser/document'
import { DocumentParserVisitor } from '../../../utils/parser/types'
import { LanguageServiceStrategy } from '../../registry/types'

import { BoilerplateService } from './service'


export class BoilerplateServiceStrategy implements LanguageServiceStrategy {

    private parser: DocumentParserVisitor

    constructor(
        parser: DocumentParserVisitor = new DocumentParser(),
    ) {
        // Use this if you need access to an AST
        this.parser = parser
    }

    async isMatch(textDocument: TextDocument): Promise<boolean> {
        return true
    }
    getLanguageService(): BoilerplateService {
        return new BoilerplateService(this.parser)
    }
}
