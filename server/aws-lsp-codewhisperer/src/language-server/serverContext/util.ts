import { WorkspaceFolder } from '@aws/language-server-runtimes/server-interface'
import { CreateUploadUrlResponse } from '../../client/token/codewhispererbearertokenclient'
import { md5 } from 'js-md5'
import got from 'got'

export enum ProgrammingLanguage {
    Java,
    Python,
    TypeScript,
    JavaScript,
    Unknown,
}

function getProgrammingLanguage(path: string): ProgrammingLanguage {
    const extension = path.split('.').pop()
    switch (extension) {
        case 'java':
            return ProgrammingLanguage.Java
        case 'py':
            return ProgrammingLanguage.Python
        case 'ts':
        case 'tsx':
        case 'mts':
        case 'cts':
        case 'd.ts':
        case 'd.mts':
        case 'd.cts':
            return ProgrammingLanguage.TypeScript
        case 'js':
        case 'jsx':
        case 'mjs':
        case 'cjs':
            return ProgrammingLanguage.JavaScript
        default:
            return ProgrammingLanguage.Unknown
    }
}
export const getProgrammingLanguageFromPath = (path: string): string => {
    const programmingLanguage = ProgrammingLanguage[getProgrammingLanguage(path)]
    return programmingLanguage
}

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

export const uploadArtifactToS3 = async (content: Buffer, resp: CreateUploadUrlResponse) => {
    const encryptionContext = `{"uploadId":"${resp.uploadId}"}`
    const md5Content = md5.base64(content)
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
