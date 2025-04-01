import { Workspace } from '@aws/language-server-runtimes/server-interface'
import { GitIgnoreAcceptor } from '@gerhobbelt/gitignore-parser'
import * as parser from '@gerhobbelt/gitignore-parser'
import * as pathUtils from './path'
import * as path from 'path'

type GitIgnoreRelativeAcceptor = {
    folderPath: string
    acceptor: GitIgnoreAcceptor
}

export class GitIgnoreFilter {
    private acceptors: GitIgnoreRelativeAcceptor[]

    private constructor(acceptors: GitIgnoreRelativeAcceptor[]) {
        this.acceptors = acceptors
    }

    public static async build(
        rootPath: string,
        gitIgnoreFiles: string[],
        workspace: Workspace
    ): Promise<GitIgnoreFilter> {
        const acceptors: GitIgnoreRelativeAcceptor[] = []

        for (const file of gitIgnoreFiles) {
            const fileContent = await workspace.fs.readFile(file)
            const gitIgnoreAcceptor = parser.compile(fileContent)

            acceptors.push({
                folderPath: rootPath,
                acceptor: gitIgnoreAcceptor,
            })
        }

        return new GitIgnoreFilter(acceptors)
    }

    public filterFiles(files: string[]) {
        return files.filter(file =>
            this.acceptors.every(acceptor => {
                if (!pathUtils.isInDirectory(acceptor.folderPath, file)) {
                    // .gitignore file is responsible only for it's subfolders
                    return true
                }
                // careful with Windows, if ignore pattern is `build`
                // the library accepts `build\file.js`, but does not accept `build/file.js`
                const systemDependantRelativePath = path.relative(acceptor.folderPath, file)
                const posixPath = systemDependantRelativePath.split(path.sep).join(path.posix.sep)
                return acceptor.acceptor.accepts(posixPath)
            })
        )
    }
}
