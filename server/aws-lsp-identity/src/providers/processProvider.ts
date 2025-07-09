import { AwsErrorCodes, IamCredentials } from '@aws/language-server-runtimes/protocol'
import { AwsError } from '@aws/lsp-core'
import { exec } from 'child_process'

// Custom promisify function which can be mocked in unit tests
export const execAsync = (command: string) => {
    return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error)
            } else {
                resolve({ stdout, stderr })
            }
        })
    })
}

// Runs an executable and parses its JSON output as an IAM/STS credential
export async function getProcessCredential(executable: string): Promise<IamCredentials> {
    const command = process.platform === 'win32' ? `cmd /C ${executable}` : `sh -c "${executable}"`
    const { stdout, stderr } = await execAsync(command)
    if (stderr) {
        throw new AwsError('Failed to execute credential process', AwsErrorCodes.E_UNKNOWN)
    }
    const parsed = JSON.parse(stdout)
    return {
        accessKeyId: parsed.AccessKeyId,
        secretAccessKey: parsed.SecretAccessKey,
        sessionToken: parsed.SessionToken,
        ...(parsed.Expiration ? { expiration: parsed.Expiration } : {}),
    }
}
