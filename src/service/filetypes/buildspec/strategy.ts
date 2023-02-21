import { TextDocument } from 'vscode-languageserver-textdocument'
import { LanguageServiceStrategy } from '../../registry/types'

import { BuildspecService } from './service'

const BUILDSPEC_FILE_NAMES = ['build', 'buildspec'].map(name => [`${name}.yml`, `${name}.yaml`]).flat()

export class BuildspecServiceStrategy implements LanguageServiceStrategy {
    async isMatch(textDocument: TextDocument): Promise<boolean> {
        return BUILDSPEC_FILE_NAMES.some(accepted => textDocument.uri.endsWith(accepted))
    }
    getLanguageService(): BuildspecService {
        return new BuildspecService()
    }
}
