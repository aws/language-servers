import { WorkspaceFolder } from '@aws/language-server-runtimes/server-interface'
import { CreateUploadUrlResponse } from '../../client/token/codewhispererbearertokenclient'
import got from 'got'
import { URI } from 'vscode-uri'
import * as fs from 'fs'

export const findWorkspaceRoot = (fileUri: string, workspaceFolders: WorkspaceFolder[]): string => {
    const matchingFolder = workspaceFolders.find(folder => fileUri.startsWith(folder.uri))
    return matchingFolder ? matchingFolder.uri : ''
}

export const findWorkspaceRootFolder = (
    fileUri: string,
    workspaceFolders: WorkspaceFolder[]
): WorkspaceFolder | undefined => {
    const matchingFolder = workspaceFolders.find(folder => fileUri.startsWith(folder.uri))
    return matchingFolder ? matchingFolder : undefined
}

export const uploadArtifactToS3 = async (content: Buffer, md5Content: string, resp: CreateUploadUrlResponse) => {
    const encryptionContext = `{"uploadId":"${resp.uploadId}"}`
    const headersObj =
        resp.kmsKeyArn !== '' || resp.kmsKeyArn !== undefined
            ? {
                  'Content-MD5': md5Content,
                  'x-amz-server-side-encryption': 'aws:kms',
                  'Content-Type': 'application/zip',
                  'x-amz-server-side-encryption-aws-kms-key-id': resp.kmsKeyArn,
                  'x-amz-server-side-encryption-context': Buffer.from(encryptionContext, 'utf8').toString('base64'),
              }
            : {
                  'Content-MD5': md5Content,
                  'x-amz-server-side-encryption': 'aws:kms',
                  'Content-Type': 'application/zip',
                  'x-amz-server-side-encryption-context': Buffer.from(encryptionContext, 'utf8').toString('base64'),
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
