import { FormattingOptions } from 'vscode-languageserver'
import { CustomFormatterOptions } from 'yaml-language-server'

export interface YamlFormattingOptions extends FormattingOptions, CustomFormatterOptions {}
