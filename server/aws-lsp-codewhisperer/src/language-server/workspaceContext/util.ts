import { CredentialsProvider, WorkspaceFolder } from '@aws/language-server-runtimes/server-interface'
import { CreateUploadUrlResponse } from '../../client/token/codewhispererbearertokenclient'
import got from 'got'
import { URI } from 'vscode-uri'
import * as fs from 'fs'
import * as crypto from 'crypto'
import * as path from 'path'

export const findWorkspaceRootFolder = (
    fileUri: string,
    workspaceFolders: WorkspaceFolder[]
): WorkspaceFolder | undefined => {
    const matchingFolder = workspaceFolders.find(folder => {
        const parsedFileUri = URI.parse(fileUri)
        const parsedFolderUri = URI.parse(folder.uri)
        return parsedFileUri.path.startsWith(parsedFolderUri.path)
    })
    return matchingFolder ? matchingFolder : undefined
}

export const uploadArtifactToS3 = async (content: Buffer, resp: CreateUploadUrlResponse) => {
    const encryptionContext = `{"uploadId":"${resp.uploadId}"}`
    let headersObj = resp.requestHeaders
        ? {
              'x-amz-checksum-sha256': resp.requestHeaders['x-amz-checksum-sha256'],
              'x-amz-expected-bucket-owner': resp.requestHeaders['x-amz-expected-bucket-owner'],
              'Content-Type': resp.requestHeaders['content-type'],
          }
        : {}
    if (resp.kmsKeyArn) {
        Object.assign(headersObj, {
            'x-amz-server-side-encryption': 'aws:kms',
            'x-amz-server-side-encryption-aws-kms-key-id': resp.kmsKeyArn,
            'x-amz-server-side-encryption-context': Buffer.from(encryptionContext, 'utf8').toString('base64'),
        })
    }
    const response = await got.put(resp.uploadUrl, {
        body: content,
        headers: headersObj,
    })
    console.log(`StatusCode: ${response.statusCode}`)
}

export const isDirectory = (path: string): boolean => {
    return fs.statSync(URI.parse(path).path).isDirectory()
}

export const isEmptyDirectory = (path: string): boolean => {
    return fs.readdirSync(URI.parse(path).path).length === 0
}

export const isLoggedInUsingBearerToken = (credentialsProvider: CredentialsProvider): boolean => {
    return credentialsProvider.hasCredentials('bearer')
}

export const getSha256Async = async (content: string | Buffer): Promise<string> => {
    return crypto.createHash('sha256').update(content).digest('base64')
}

export const getRelativePath = (workspaceFolder: WorkspaceFolder, filePath: string): string => {
    const workspaceUri = URI.parse(workspaceFolder.uri)
    const fileUri = URI.parse(filePath)
    return path.relative(workspaceUri.path, fileUri.path)
}
