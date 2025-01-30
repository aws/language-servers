import { WorkspaceFolder } from '@aws/language-server-runtimes/server-interface'

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
    const matchingFolder = workspaceFolders.find(folder =>
        fileUri.startsWith(folder.uri)
    );
    return matchingFolder ? matchingFolder.uri : '';
}
