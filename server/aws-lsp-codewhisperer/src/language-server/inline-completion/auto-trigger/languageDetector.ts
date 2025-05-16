/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Interface for language-specific detection
 */
export interface LanguageDetector {
    isAfterKeyword(lineContent: string): boolean
    isAfterOperatorOrDelimiter(lineContent: string): boolean
    isAtLineBeginning(lineContent: string): boolean
    getKeywords(): string[]
    getOperatorsAndDelimiters(): string[]
}

/**
 * Factory for creating language-specific detectors
 */
export class LanguageDetectorFactory {
    private static detectors: Map<string, LanguageDetector> = new Map()
    
    /**
     * Get a language detector for the specified language
     */
    public static getDetector(language: string): LanguageDetector {
        const normalizedLanguage = language.toLowerCase()
        
        if (!this.detectors.has(normalizedLanguage)) {
            switch (normalizedLanguage) {
                case 'java':
                    this.detectors.set(normalizedLanguage, new JavaLanguageDetector())
                    break
                case 'python':
                    this.detectors.set(normalizedLanguage, new PythonLanguageDetector())
                    break
                case 'javascript':
                case 'typescript':
                    this.detectors.set(normalizedLanguage, new JavaScriptLanguageDetector())
                    break
                default:
                    // Default to a generic detector for unsupported languages
                    this.detectors.set(normalizedLanguage, new GenericLanguageDetector())
            }
        }
        
        return this.detectors.get(normalizedLanguage)!
    }
}

/**
 * Base class for language detectors with common functionality
 */
abstract class BaseLanguageDetector implements LanguageDetector {
    abstract getKeywords(): string[]
    abstract getOperatorsAndDelimiters(): string[]
    
    public isAfterKeyword(lineContent: string): boolean {
        const trimmedContent = lineContent.trim()
        const words = trimmedContent.split(/\s+/)
        const lastWord = words[words.length - 1]
        
        return this.getKeywords().includes(lastWord)
    }
    
    public isAfterOperatorOrDelimiter(lineContent: string): boolean {
        if (lineContent.length === 0) {
            return false
        }
        
        const lastChar = lineContent[lineContent.length - 1]
        return this.getOperatorsAndDelimiters().includes(lastChar)
    }
    
    public isAtLineBeginning(lineContent: string): boolean {
        return lineContent.trim().length === 0
    }
}

/**
 * Java language detector implementation
 */
class JavaLanguageDetector extends BaseLanguageDetector {
    public getKeywords(): string[] {
        return [
            'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 
            'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 
            'extends', 'final', 'finally', 'float', 'for', 'if', 'goto', 'implements', 
            'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new', 'package', 
            'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp', 
            'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 
            'try', 'void', 'volatile', 'while'
        ]
    }
    
    public getOperatorsAndDelimiters(): string[] {
        return [
            '=', '==', '!=', '<', '>', '<=', '>=', '+', '-', '*', '/', '%', '++', '--',
            '&', '|', '^', '~', '<<', '>>', '>>>', '&&', '||', '!', '?', ':',
            '(', '{', '[', '.', ';', '}'
        ]
    }
}

/**
 * Python language detector implementation
 */
class PythonLanguageDetector extends BaseLanguageDetector {
    public getKeywords(): string[] {
        return [
            'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 
            'def', 'del', 'elif', 'else', 'except', 'False', 'finally', 'for', 'from', 
            'global', 'if', 'import', 'in', 'is', 'lambda', 'None', 'nonlocal', 'not', 
            'or', 'pass', 'raise', 'return', 'True', 'try', 'while', 'with', 'yield'
        ]
    }
    
    public getOperatorsAndDelimiters(): string[] {
        return [
            '+', '-', '*', '**', '/', '//', '%', '@', '<<', '>>', '&', '|', '^', '~',
            '<', '>', '<=', '>=', '==', '!=', '=', '+=', '-=', '*=', '/=', '%=', '@=',
            '&=', '|=', '^=', '<<=', '>>=', '**=', '//=',
            '(', '{', '[', '.', ':', ';', '}', ']', ')'
        ]
    }
}

/**
 * JavaScript language detector implementation
 */
class JavaScriptLanguageDetector extends BaseLanguageDetector {
    public getKeywords(): string[] {
        return [
            'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 
            'default', 'delete', 'do', 'else', 'enum', 'export', 'extends', 'false', 
            'finally', 'for', 'function', 'if', 'implements', 'import', 'in', 'instanceof', 
            'interface', 'let', 'new', 'null', 'package', 'private', 'protected', 'public', 
            'return', 'super', 'switch', 'static', 'this', 'throw', 'true', 'try', 
            'typeof', 'var', 'void', 'while', 'with', 'yield'
        ]
    }
    
    public getOperatorsAndDelimiters(): string[] {
        return [
            '=', '==', '===', '!=', '!==', '<', '>', '<=', '>=', '+', '-', '*', '/', '%',
            '++', '--', '&', '|', '^', '~', '<<', '>>', '>>>', '&&', '||', '!', '?', ':',
            '(', '{', '[', '.', ';', '=>', '}', ']', ')'
        ]
    }
}

/**
 * Generic language detector implementation for unsupported languages
 */
class GenericLanguageDetector extends BaseLanguageDetector {
    public getKeywords(): string[] {
        return []
    }
    
    public getOperatorsAndDelimiters(): string[] {
        return [
            '=', '+', '-', '*', '/', '%', '<', '>', '!', '&', '|', '^', '~',
            '(', '{', '[', '.', ':', ';', ','
        ]
    }
}
