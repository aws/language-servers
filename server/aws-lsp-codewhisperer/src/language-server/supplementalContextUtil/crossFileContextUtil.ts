/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

// Port of implementation in AWS Toolkit for VSCode
// https://github.com/aws/aws-toolkit-vscode/blob/9d8ddbd85f4533e539a58e76f7c46883d8e50a79/packages/core/src/codewhisperer/util/supplementalContext/crossFileContextUtil.ts
// Implementation is converted to work with LSP TextDocument instead of vscode APIs.

import path = require('path')
import { BM25Document, BM25Okapi } from './rankBm25'
import { crossFileContextConfig } from '../models/constants'
import { isTestFile } from './codeParsingUtil'
import { getFileDistance } from '../utilities/filesystemUtilities'
import { CodeWhispererSupplementalContext, CodeWhispererSupplementalContextItem } from '../models/model'
import {
    CancellationToken,
    Position,
    TextDocument,
    Workspace,
    Range,
    Logging,
} from '@aws/language-server-runtimes/server-interface'
import { CancellationError } from './supplementalContextUtil'

type CrossFileSupportedLanguage =
    | 'java'
    | 'python'
    | 'javascript'
    | 'typescript'
    | 'javascriptreact'
    | 'typescriptreact'

// TODO: ugly, can we make it prettier? like we have to manually type 'java', 'javascriptreact' which is error prone
// TODO: Move to another config file or constants file
// Supported language to its corresponding file ext
const supportedLanguageToDialects: Readonly<Record<CrossFileSupportedLanguage, Set<string>>> = {
    java: new Set<string>(['.java']),
    python: new Set<string>(['.py']),
    javascript: new Set<string>(['.js', '.jsx']),
    javascriptreact: new Set<string>(['.js', '.jsx']),
    typescript: new Set<string>(['.ts', '.tsx']),
    typescriptreact: new Set<string>(['.ts', '.tsx']),
}

function isCrossFileSupported(languageId: string): languageId is CrossFileSupportedLanguage {
    return Object.keys(supportedLanguageToDialects).includes(languageId)
}

interface Chunk {
    fileName: string
    content: string
    nextContent: string
    score?: number
}

export async function fetchSupplementalContextForSrc(
    document: TextDocument,
    position: Position,
    workspace: Workspace,
    logging: Logging,
    cancellationToken: CancellationToken
): Promise<Pick<CodeWhispererSupplementalContext, 'supplementalContextItems' | 'strategy'> | undefined> {
    const shouldProceed = shouldFetchCrossFileContext(document.languageId)

    if (!shouldProceed) {
        return shouldProceed === undefined
            ? undefined
            : {
                  supplementalContextItems: [],
                  strategy: 'Empty',
              }
    }

    const codeChunksCalculated = crossFileContextConfig.numberOfChunkToFetch

    // Step 1: Get relevant cross files to refer
    const relevantCrossFileCandidates = await getCrossFileCandidates(document, workspace, logging)

    throwIfCancelled(cancellationToken)

    // Step 2: Split files to chunks with upper bound on chunkCount
    // We restrict the total number of chunks to improve on latency.
    // Chunk linking is required as we want to pass the next chunk value for matched chunk.
    let chunkList: Chunk[] = []
    for (const relevantFile of relevantCrossFileCandidates) {
        throwIfCancelled(cancellationToken)
        const chunks: Chunk[] = await splitFileToChunks(relevantFile, crossFileContextConfig.numberOfLinesEachChunk)
        const linkedChunks = linkChunks(chunks)
        chunkList.push(...linkedChunks)
        if (chunkList.length >= codeChunksCalculated) {
            break
        }
    }

    // it's required since chunkList.push(...) is likely giving us a list of size > 60
    chunkList = chunkList.slice(0, codeChunksCalculated)

    // Step 3: Generate Input chunk (10 lines left of cursor position)
    // and Find Best K chunks w.r.t input chunk using BM25
    const inputChunk: Chunk = getInputChunk(document, position, crossFileContextConfig.numberOfLinesEachChunk)
    const bestChunks: Chunk[] = findBestKChunkMatches(inputChunk, chunkList, crossFileContextConfig.topK)
    throwIfCancelled(cancellationToken)

    // Step 4: Transform best chunks to supplemental contexts
    const supplementalContexts: CodeWhispererSupplementalContextItem[] = []
    for (const chunk of bestChunks) {
        throwIfCancelled(cancellationToken)

        supplementalContexts.push({
            filePath: chunk.fileName,
            content: chunk.nextContent,
            score: chunk.score,
        })
    }

    // DO NOT send code chunk with empty content
    return {
        supplementalContextItems: supplementalContexts.filter(item => item.content.trim().length !== 0),
        strategy: 'OpenTabs_BM25',
    }
}

function findBestKChunkMatches(chunkInput: Chunk, chunkReferences: Chunk[], k: number): Chunk[] {
    const chunkContentList = chunkReferences.map(chunk => chunk.content)

    //performBM25Scoring returns the output in a sorted order (descending of scores)
    const top3: BM25Document[] = new BM25Okapi(chunkContentList).topN(chunkInput.content, crossFileContextConfig.topK)

    return top3.map(doc => {
        // reference to the original metadata since BM25.top3 will sort the result
        const chunkIndex = doc.index
        const chunkReference = chunkReferences[chunkIndex]
        return {
            content: chunkReference.content,
            fileName: chunkReference.fileName,
            nextContent: chunkReference.nextContent,
            score: doc.score,
        }
    })
}

/* This extract 10 lines to the left of the cursor from trigger file.
 * This will be the inputquery to bm25 matching against list of cross-file chunks
 */
function getInputChunk(document: TextDocument, cursorPosition: Position, chunkSize: number) {
    const startLine = Math.max(cursorPosition.line - chunkSize, 0)
    const endLine = Math.max(cursorPosition.line - 1, 0)
    const endCharacter = document.getText(Range.create(endLine, 0, endLine + 1, 0)).trimRight().length
    const inputChunkContent = document
        .getText(Range.create(startLine, 0, endLine, endCharacter))
        .replaceAll('\r\n', '\n')
    const inputChunk: Chunk = { fileName: path.basename(document.uri), content: inputChunkContent, nextContent: '' }
    return inputChunk
}

/**
 * UserGroup is not used in VsCode implementation, keeping param for reference, but not implemented.
 *
 * Util to decide if we need to fetch crossfile context since CodeWhisperer CrossFile Context feature is gated by userGroup and language level
 * @param languageId: LSP TextDocument language Identifier
 * @param userGroup: CodeWhisperer user group settings, refer to userGroupUtil.ts
 * @returns specifically returning undefined if the langueage is not supported,
 * otherwise true/false depending on if the language is fully supported or not belonging to the user group
 */
function shouldFetchCrossFileContext(
    languageId: TextDocument['languageId'],
    _userGroup?: any // UserGroup
): boolean | undefined {
    if (!isCrossFileSupported(languageId)) {
        return undefined
    }

    return true
}

/**
 * This linking is required from science experimentations to pass the next contnet chunk
 * when a given chunk context passes the match in BM25.
 * Special handling is needed for last(its next points to its own) and first chunk
 */
function linkChunks(chunks: Chunk[]) {
    const updatedChunks: Chunk[] = []

    // This additional chunk is needed to create a next pointer to chunk 0.
    const firstChunk = chunks[0]
    const firstChunkSubContent = firstChunk.content.split('\n').slice(0, 3).join('\n').trimEnd()
    const newFirstChunk = {
        fileName: firstChunk.fileName,
        content: firstChunkSubContent,
        nextContent: firstChunk.content,
    }
    updatedChunks.push(newFirstChunk)

    const n = chunks.length
    for (let i = 0; i < n; i++) {
        const chunk = chunks[i]
        const nextChunk = i < n - 1 ? chunks[i + 1] : chunk

        chunk.nextContent = nextChunk.content
        updatedChunks.push(chunk)
    }

    return updatedChunks
}

export async function splitFileToChunks(document: TextDocument, chunkSize: number): Promise<Chunk[]> {
    const chunks: Chunk[] = []

    const fileContent = document.getText().trimEnd().replaceAll('\r\n', '\n')
    const lines = fileContent.split('\n')

    for (let i = 0; i < lines.length; i += chunkSize) {
        const chunkContent = lines.slice(i, Math.min(i + chunkSize, lines.length)).join('\n')
        const chunk = { fileName: new URL(document.uri).pathname, content: chunkContent.trimEnd(), nextContent: '' }
        chunks.push(chunk)
    }
    return chunks
}

type FileDistance = {
    file: TextDocument
    fileDistance: number
}

/**
 * This function will return relevant cross files sorted by file distance for the given editor file
 * by referencing open files, imported files and same package files.
 */
export async function getCrossFileCandidates(
    document: TextDocument,
    workspace: Workspace,
    logging: Logging
): Promise<TextDocument[]> {
    const targetFile = document.uri
    const language = document.languageId as CrossFileSupportedLanguage
    const dialects = supportedLanguageToDialects[language]

    /**
     * Consider a file which
     * 1. is different from the target
     * 2. has the same file extension or it's one of the dialect of target file (e.g .js vs. .jsx)
     * 3. is not a test file
     *
     * Porting note: this function relies of Workspace feature to get all documents,
     * managed by this language server, instead of VSCode `vscode.window` API as VSCode toolkit does.
     */
    const unsortedCandidates = await workspace.getAllTextDocuments()
    return unsortedCandidates
        .filter((candidateFile: TextDocument) => {
            return !!(
                targetFile !== candidateFile.uri &&
                (path.extname(targetFile) === path.extname(candidateFile.uri) ||
                    (dialects && dialects.has(path.extname(candidateFile.uri)))) &&
                !isTestFile(new URL(candidateFile.uri).pathname, { languageId: language })
            )
        })
        .map((candidate: TextDocument): FileDistance => {
            return {
                file: candidate,
                // PORT_TODO: port and test getFileDistance to work with LSP's URIs
                fileDistance: getFileDistance(targetFile, candidate.uri),
            }
        })
        .sort((file1: FileDistance, file2: FileDistance) => {
            return file1.fileDistance - file2.fileDistance
        })
        .map((fileToDistance: FileDistance) => {
            return fileToDistance.file
        })
}

function throwIfCancelled(token: CancellationToken): void | never {
    if (token.isCancellationRequested) {
        throw new CancellationError()
    }
}
