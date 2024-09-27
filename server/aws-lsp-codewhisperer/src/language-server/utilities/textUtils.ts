// Partial port of implementation in AWS Toolkit for VSCode
// https://github.com/aws/aws-toolkit-vscode/blob/0c4289b1a0b5d294cc352f7d2e7e586937ac0318/packages/core/src/shared/utilities/textUtilities.ts#L391

export function undefinedIfEmpty(str: string | undefined): string | undefined {
    if (str && str.trim().length > 0) {
        return str
    }

    return undefined
}
