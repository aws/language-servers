// Port of implementation in AWS Toolkit for VSCode
// https://github.com/aws/aws-toolkit-vscode/blob/ac9a78db90192fe13dcd82ac0b30e6f84c39b9c8/packages/core/src/shared/filesystemUtilities.ts

import * as pathutils from './path'

/**
 *
 * @returns file distance between fileA and fileB
 * For example:
 * The file distance between A/B/C.java and A/B/D.java is 0
 * The file distance between A/B/C.java and A/D.java is 1
 */
export function getFileDistance(fileA: string, fileB: string): number {
    let filePathA = pathutils.normalize(fileA).split('/')
    filePathA = filePathA.slice(0, filePathA.length - 1)

    let filePathB = pathutils.normalize(fileB).split('/')
    filePathB = filePathB.slice(0, filePathB.length - 1)

    let i = 0
    while (i < Math.min(filePathA.length, filePathB.length)) {
        const dir1 = filePathA[i]
        const dir2 = filePathB[i]

        if (dir1 !== dir2) {
            break
        }

        i++
    }

    return filePathA.slice(i).length + filePathB.slice(i).length
}
