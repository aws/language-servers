import { CredentialsProvider, WorkspaceFolder } from '@aws/language-server-runtimes/server-interface'
import { CreateUploadUrlResponse } from '../../client/token/codewhispererbearertokenclient'
import { URI } from 'vscode-uri'
import * as fs from 'fs'
import * as crypto from 'crypto'
import * as path from 'path'
import axios from 'axios'

export const findWorkspaceRootFolder = (
    fileUri: string,
    workspaceFolders: WorkspaceFolder[]
): WorkspaceFolder | undefined => {
    const parsedFileUri = URI.parse(fileUri)

    // Sort workspace folders by path length (descending) to find most specific match first
    const sortedFolders = [...workspaceFolders].sort((a, b) => {
        const aPath = URI.parse(a.uri).path
        const bPath = URI.parse(b.uri).path
        return bPath.length - aPath.length // Longest path first
    })

    const matchingFolder = sortedFolders.find(folder => {
        const parsedFolderUri = URI.parse(folder.uri)
        return parsedFileUri.path.startsWith(parsedFolderUri.path)
    })

    return matchingFolder
}

export const cleanUrl = (s3Url: string): string => {
    return new URL(s3Url).origin + new URL(s3Url).pathname
}

export const uploadArtifactToS3 = async (content: Buffer, resp: CreateUploadUrlResponse) => {
    const encryptionContext = `{"WorkspaceId":"${resp.uploadId}"}`
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
    await axios.put(resp.uploadUrl, content, { headers: headersObj })
}

export const isDirectory = (path: string): boolean => {
    return fs.statSync(URI.parse(path).path).isDirectory()
}

export const resolveSymlink = (dependencyPath: string): string => {
    let truePath: string = dependencyPath
    if (fs.lstatSync(dependencyPath).isSymbolicLink()) {
        // Get the real path (resolves all symlinks in the path)
        truePath = fs.realpathSync(dependencyPath)
    }
    return truePath
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
