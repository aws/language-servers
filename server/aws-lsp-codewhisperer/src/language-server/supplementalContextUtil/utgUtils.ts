/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

// Port of implementation in AWS Toolkit for VSCode
// https://github.com/aws/aws-toolkit-vscode/blob/9d8ddbd85f4533e539a58e76f7c46883d8e50a79/packages/core/src/codewhisperer/util/supplementalContext/utgUtils.ts

import * as path from 'path'
import { fs } from '../../../shared'
import * as vscode from 'vscode'
import { CancellationToken, Logging, TextDocument, Workspace } from '@aws/language-server-runtimes/server-interface'
import {
    countSubstringMatches,
    extractClasses,
    extractFunctions,
    isTestFile,
    utgLanguageConfig,
    utgLanguageConfigs,
} from './codeParsingUtil'
import { supplemetalContextFetchingTimeoutMsg } from '../models/constants'
import { CancellationError } from './supplementalContextUtil'
import { utgConfig } from '../models/constants'
// import { CodeWhispererUserGroupSettings } from '../userGroupUtil'
// import { UserGroup } from '../models/constants'
import { getOpenFilesInWindow } from '../../../shared/utilities/editorUtilities'
import { CodeWhispererSupplementalContext, CodeWhispererSupplementalContextItem, UtgStrategy } from '../models/model'

let log = (message: any) => {
    console.log(message)
}

type UtgSupportedLanguage = keyof typeof utgLanguageConfigs

function isUtgSupportedLanguage(languageId: TextDocument['languageId']): languageId is UtgSupportedLanguage {
    return languageId in utgLanguageConfigs
}

export function shouldFetchUtgContext(
    languageId: TextDocument['languageId']
    // userGroup: UserGroup - disabling since UserGroup feature is not ported yet.
): boolean | undefined {
    if (!isUtgSupportedLanguage(languageId)) {
        return undefined
    }

    if (languageId === 'java') {
        return true
    } else {
        // TODO: how to get about UserGroup here? It is not supported in LS.
        // return userGroup === UserGroup.CrossFile
    }
}

/**
 * This function attempts to find a focal file for the given trigger file.
 * Attempt 1: If naming patterns followed correctly, source file can be found by name referencing.
 * Attempt 2: Compare the function and class names of trigger file and all other open files in editor
 * to find the closest match.
 * Once found the focal file, we split it into multiple pieces as supplementalContext.
 * @param editor
 * @returns
 */
export async function fetchSupplementalContextForTest(
    editor: vscode.TextEditor,
    document: TextDocument,
    workspace: Workspace,
    logging: Logging,
    cancellationToken: CancellationToken
): Promise<Pick<CodeWhispererSupplementalContext, 'supplementalContextItems' | 'strategy'> | undefined> {
    // Setup logger function
    log = message => logging.log(message)

    const shouldProceed = shouldFetchUtgContext(document.languageId)

    if (!shouldProceed) {
        return shouldProceed === undefined ? undefined : { supplementalContextItems: [], strategy: 'Empty' }
    }

    const languageConfig = utgLanguageConfigs[document.languageId]

    // TODO (Metrics): 1. Total number of calls to fetchSupplementalContextForTest
    throwIfCancelled(cancellationToken)

    let crossSourceFile = await findSourceFileByName(document, languageConfig, workspace, cancellationToken)
    if (crossSourceFile) {
        // TODO (Metrics): 2. Success count for fetchSourceFileByName (find source file by name)
        log(`CodeWhisperer finished fetching utg context by file name`)
        return {
            supplementalContextItems: await generateSupplementalContextFromFocalFile(
                crossSourceFile,
                'ByName',
                cancellationToken
            ),
            strategy: 'ByName',
        }
    }
    throwIfCancelled(cancellationToken)

    crossSourceFile = await findSourceFileByContent(editor, languageConfig, cancellationToken)
    if (crossSourceFile) {
        // TODO (Metrics): 3. Success count for fetchSourceFileByContent (find source file by content)
        log(`CodeWhisperer finished fetching utg context by file content`)
        return {
            supplementalContextItems: await generateSupplementalContextFromFocalFile(
                crossSourceFile,
                'ByContent',
                cancellationToken
            ),
            strategy: 'ByContent',
        }
    }

    // TODO (Metrics): 4. Failure count - when unable to find focal file (supplemental context empty)
    log(`CodeWhisperer failed to fetch utg context`)
    return {
        supplementalContextItems: [],
        strategy: 'Empty',
    }
}

async function generateSupplementalContextFromFocalFile(
    filePath: string,
    strategy: UtgStrategy,
    cancellationToken: CancellationToken
): Promise<CodeWhispererSupplementalContextItem[]> {
    const fileContent = await fs.readFileAsString(vscode.Uri.parse(filePath!).fsPath)

    // DO NOT send code chunk with empty content
    if (fileContent.trim().length === 0) {
        return []
    }

    return [
        {
            filePath: filePath,
            content: 'UTG\n' + fileContent.slice(0, Math.min(fileContent.length, utgConfig.maxSegmentSize)),
        },
    ]
}

async function findSourceFileByContent(
    editor: vscode.TextEditor,
    languageConfig: utgLanguageConfig,
    cancellationToken: CancellationToken
): Promise<string | undefined> {
    const testFileContent = await fs.readFileAsString(editor.document.fileName)
    const testElementList = extractFunctions(testFileContent, languageConfig.functionExtractionPattern)

    throwIfCancelled(cancellationToken)

    testElementList.push(...extractClasses(editor.document.fileName, languageConfig.classExtractionPattern))

    throwIfCancelled(cancellationToken)

    let sourceFilePath: string | undefined = undefined
    let maxMatchCount = 0

    if (testElementList.length === 0) {
        // TODO: Add metrics here, as unable to parse test file using Regex.
        return sourceFilePath
    }

    const relevantFilePaths = await getRelevantUtgFiles(editor)

    throwIfCancelled(cancellationToken)

    // TODO (Metrics):Add metrics for relevantFilePaths length
    for (const filePath of relevantFilePaths) {
        throwIfCancelled(cancellationToken)

        const fileContent = await fs.readFileAsString(filePath)
        const elementList = extractFunctions(fileContent, languageConfig.functionExtractionPattern)
        elementList.push(...extractClasses(fileContent, languageConfig.classExtractionPattern))
        const matchCount = countSubstringMatches(elementList, testElementList)
        if (matchCount > maxMatchCount) {
            maxMatchCount = matchCount
            sourceFilePath = filePath
        }
    }
    return sourceFilePath
}

async function getRelevantUtgFiles(editor: vscode.TextEditor): Promise<string[]> {
    const targetFile = editor.document.uri.fsPath
    const language = editor.document.languageId

    return await getOpenFilesInWindow(async candidateFile => {
        return (
            targetFile !== candidateFile &&
            path.extname(targetFile) === path.extname(candidateFile) &&
            !(await isTestFile(candidateFile, { languageId: language }))
        )
    })
}

// PORT_TODO: this function has edge cases not covered in VSCode
// Regexp matcher has edge cases and can result in rong responses
// Path matching of dirname for constructing path does not work when `/test` is last section
// Keeping this working at low effort
async function findSourceFileByName(
    document: TextDocument,
    languageConfig: utgLanguageConfig,
    workspace: Workspace,
    cancellationToken: CancellationToken
): Promise<string | undefined> {
    const testFileName = path.basename(document.uri)

    let basenameSuffix = testFileName
    const match = testFileName.match(languageConfig.testFilenamePattern)
    if (match) {
        basenameSuffix = match[1] || match[2] || match[3] // Added 3rd value, as Java pattern has 3 matchers
    }

    throwIfCancelled(cancellationToken)

    // Assuming the convention of using similar path structure for test and src files.
    const dirPath = path.dirname(document.uri)
    let newPath = ''
    const lastIndexTest = dirPath.lastIndexOf('/test') // Removed trailing /, since paths where test is last element were not supported
    const lastIndexTst = dirPath.lastIndexOf('/tst')
    // This is a faster way on the assumption that source file and test file will follow similar path structure.
    if (lastIndexTest > 0) {
        newPath = dirPath.substring(0, lastIndexTest) + '/src' + dirPath.substring(lastIndexTest + 5)
    } else if (lastIndexTst > 0) {
        newPath = dirPath.substring(0, lastIndexTst) + '/src' + dirPath.substring(lastIndexTst + 4)
    }
    newPath = path.join(newPath, basenameSuffix + languageConfig.extension)

    // PORT_TODO: WIP Checkpoint

    // TODO: Add metrics here, as we are not able to find the source file by name.
    if (await workspace.fs.exists(newPath)) {
        return newPath
    }

    throwIfCancelled(cancellationToken)

    const sourceFiles = await vscode.workspace.findFiles(`**/${basenameSuffix}${languageConfig.extension}`)

    throwIfCancelled(cancellationToken)

    if (sourceFiles.length > 0) {
        return sourceFiles[0].toString()
    }
    return undefined
}

function throwIfCancelled(token: CancellationToken): void | never {
    if (token.isCancellationRequested) {
        throw new CancellationError('Timeout: ' + supplemetalContextFetchingTimeoutMsg)
    }
}
