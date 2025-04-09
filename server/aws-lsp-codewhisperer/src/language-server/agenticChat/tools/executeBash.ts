// Port from VSC https://github.com/aws/aws-toolkit-vscode/blob/093d5bcbce777c88cf18c76b52738610263d1fc0/packages/core/src/codewhispererChat/tools/executeBash.ts#L134

import { InvokeOutput } from './toolShared'
import { split } from 'shlex'
import { Logging } from '@aws/language-server-runtimes/server-interface'
import { processUtils } from '@aws/lsp-core'
import { getUserHomeDir, sanitize } from '@aws/lsp-core/out/util/path'

export enum CommandCategory {
    ReadOnly,
    HighRisk,
    Destructive,
}

export const dangerousPatterns = new Set(['<(', '$(', '`'])
export const splitOperators = new Set(['|', '&&', '||', '>'])
export const splitOperatorsArray = Array.from(splitOperators)
export const commandCategories = new Map<string, CommandCategory>([
    // ReadOnly commands
    ['ls', CommandCategory.ReadOnly],
    ['cat', CommandCategory.ReadOnly],
    ['bat', CommandCategory.ReadOnly],
    ['pwd', CommandCategory.ReadOnly],
    ['echo', CommandCategory.ReadOnly],
    ['file', CommandCategory.ReadOnly],
    ['less', CommandCategory.ReadOnly],
    ['more', CommandCategory.ReadOnly],
    ['tree', CommandCategory.ReadOnly],
    ['find', CommandCategory.ReadOnly],
    ['top', CommandCategory.ReadOnly],
    ['htop', CommandCategory.ReadOnly],
    ['ps', CommandCategory.ReadOnly],
    ['df', CommandCategory.ReadOnly],
    ['du', CommandCategory.ReadOnly],
    ['free', CommandCategory.ReadOnly],
    ['uname', CommandCategory.ReadOnly],
    ['date', CommandCategory.ReadOnly],
    ['whoami', CommandCategory.ReadOnly],
    ['which', CommandCategory.ReadOnly],
    ['ping', CommandCategory.ReadOnly],
    ['ifconfig', CommandCategory.ReadOnly],
    ['ip', CommandCategory.ReadOnly],
    ['netstat', CommandCategory.ReadOnly],
    ['ss', CommandCategory.ReadOnly],
    ['dig', CommandCategory.ReadOnly],
    ['grep', CommandCategory.ReadOnly],
    ['wc', CommandCategory.ReadOnly],
    ['sort', CommandCategory.ReadOnly],
    ['diff', CommandCategory.ReadOnly],
    ['head', CommandCategory.ReadOnly],
    ['tail', CommandCategory.ReadOnly],

    // HighRisk commands
    ['chmod', CommandCategory.HighRisk],
    ['chown', CommandCategory.HighRisk],
    ['mv', CommandCategory.HighRisk],
    ['cp', CommandCategory.HighRisk],
    ['ln', CommandCategory.HighRisk],
    ['mount', CommandCategory.HighRisk],
    ['umount', CommandCategory.HighRisk],
    ['kill', CommandCategory.HighRisk],
    ['killall', CommandCategory.HighRisk],
    ['pkill', CommandCategory.HighRisk],
    ['iptables', CommandCategory.HighRisk],
    ['route', CommandCategory.HighRisk],
    ['systemctl', CommandCategory.HighRisk],
    ['service', CommandCategory.HighRisk],
    ['crontab', CommandCategory.HighRisk],
    ['at', CommandCategory.HighRisk],
    ['tar', CommandCategory.HighRisk],
    ['awk', CommandCategory.HighRisk],
    ['sed', CommandCategory.HighRisk],
    ['wget', CommandCategory.HighRisk],
    ['curl', CommandCategory.HighRisk],
    ['nc', CommandCategory.HighRisk],
    ['ssh', CommandCategory.HighRisk],
    ['scp', CommandCategory.HighRisk],
    ['ftp', CommandCategory.HighRisk],
    ['sftp', CommandCategory.HighRisk],
    ['rsync', CommandCategory.HighRisk],
    ['chroot', CommandCategory.HighRisk],
    ['lsof', CommandCategory.HighRisk],
    ['strace', CommandCategory.HighRisk],
    ['gdb', CommandCategory.HighRisk],

    // Destructive commands
    ['rm', CommandCategory.Destructive],
    ['dd', CommandCategory.Destructive],
    ['mkfs', CommandCategory.Destructive],
    ['fdisk', CommandCategory.Destructive],
    ['shutdown', CommandCategory.Destructive],
    ['reboot', CommandCategory.Destructive],
    ['poweroff', CommandCategory.Destructive],
    ['sudo', CommandCategory.Destructive],
    ['su', CommandCategory.Destructive],
    ['useradd', CommandCategory.Destructive],
    ['userdel', CommandCategory.Destructive],
    ['passwd', CommandCategory.Destructive],
    ['visudo', CommandCategory.Destructive],
    ['insmod', CommandCategory.Destructive],
    ['rmmod', CommandCategory.Destructive],
    ['modprobe', CommandCategory.Destructive],
    ['apt', CommandCategory.Destructive],
    ['yum', CommandCategory.Destructive],
    ['dnf', CommandCategory.Destructive],
    ['pacman', CommandCategory.Destructive],
    ['perl', CommandCategory.Destructive],
    ['python', CommandCategory.Destructive],
    ['bash', CommandCategory.Destructive],
    ['sh', CommandCategory.Destructive],
    ['exec', CommandCategory.Destructive],
    ['eval', CommandCategory.Destructive],
    ['xargs', CommandCategory.Destructive],
])
export const maxBashToolResponseSize: number = 1024 * 1024 // 1MB
export const lineCount: number = 1024
export const destructiveCommandWarningMessage = '⚠️ WARNING: Destructive command detected:\n\n'
export const highRiskCommandWarningMessage = '⚠️ WARNING: High risk command detected:\n\n'

export interface ExecuteBashParams {
    command: string
    cwd?: string
}

export interface CommandValidation {
    requiresAcceptance: boolean
    warning?: string
}

export class ExecuteBash {
    constructor(private readonly logger: Logging) {}

    public async validate(logging: Logging, command: string): Promise<void> {
        if (!command.trim()) {
            throw new Error('Bash command cannot be empty.')
        }

        const args = split(command)
        if (!args || args.length === 0) {
            throw new Error('No command found.')
        }

        try {
            await ExecuteBash.whichCommand(logging, args[0])
        } catch {
            throw new Error(`Command '${args[0]}' not found on PATH.`)
        }
    }

    public requiresAcceptance(command: string): CommandValidation {
        try {
            const args = split(command)
            if (!args || args.length === 0) {
                return { requiresAcceptance: true }
            }

            // Split commands by operators and process each segment
            let currentCmd: string[] = []
            const allCommands: string[][] = []

            for (const arg of args) {
                if (splitOperators.has(arg)) {
                    if (currentCmd.length > 0) {
                        allCommands.push(currentCmd)
                    }
                    currentCmd = []
                } else if (splitOperatorsArray.some(op => arg.includes(op))) {
                    return { requiresAcceptance: true }
                } else {
                    currentCmd.push(arg)
                }
            }

            if (currentCmd.length > 0) {
                allCommands.push(currentCmd)
            }

            for (const cmdArgs of allCommands) {
                if (cmdArgs.length === 0) {
                    return { requiresAcceptance: true }
                }

                const command = cmdArgs[0]
                const category = commandCategories.get(command)

                switch (category) {
                    case CommandCategory.Destructive:
                        return { requiresAcceptance: true, warning: destructiveCommandWarningMessage }
                    case CommandCategory.HighRisk:
                        return {
                            requiresAcceptance: true,
                            warning: highRiskCommandWarningMessage,
                        }
                    case CommandCategory.ReadOnly:
                        if (cmdArgs.some(arg => Array.from(dangerousPatterns).some(pattern => arg.includes(pattern)))) {
                            return { requiresAcceptance: true, warning: highRiskCommandWarningMessage }
                        }
                        continue
                    default:
                        return { requiresAcceptance: true, warning: highRiskCommandWarningMessage }
                }
            }
            return { requiresAcceptance: false }
        } catch (error) {
            this.logger.warn(`Error while checking acceptance: ${(error as Error).message}`)
            return { requiresAcceptance: true }
        }
    }

    public async invoke(params: ExecuteBashParams, updates?: WritableStream): Promise<InvokeOutput> {
        await this.validate(this.logger, params.command)
        const cwd = params.cwd ? sanitize(params.cwd) : getUserHomeDir()
        this.logger.info(`Invoking bash command: '${params.command}' in cwd: '${cwd}'`)

        return new Promise(async (resolve, reject) => {
            this.logger.debug(`Spawning process with command: bash -c '${params.command}' (cwd=${cwd})`)

            const stdoutBuffer: string[] = []
            const stderrBuffer: string[] = []

            let firstChunk = true
            let firstStderrChunk = true
            const writer = updates?.getWriter()
            const childProcessOptions: processUtils.ChildProcessOptions = {
                spawnOptions: {
                    cwd: cwd,
                    stdio: ['pipe', 'pipe', 'pipe'],
                },
                collect: false,
                waitForStreams: true,
                onStdout: (chunk: string) => {
                    ExecuteBash.handleChunk(firstChunk ? '```console\n' + chunk : chunk, stdoutBuffer, writer)
                    firstChunk = false
                },
                onStderr: (chunk: string) => {
                    ExecuteBash.handleChunk(firstStderrChunk ? '```console\n' + chunk : chunk, stderrBuffer, writer)
                    firstStderrChunk = false
                },
            }

            const childProcess = new processUtils.ChildProcess(
                this.logger,
                'bash',
                ['-c', params.command],
                childProcessOptions
            )

            try {
                const result = await childProcess.run()
                const exitStatus = result.exitCode ?? 0
                const stdout = stdoutBuffer.join('\n')
                const stderr = stderrBuffer.join('\n')
                const [stdoutTrunc, stdoutSuffix] = ExecuteBash.truncateSafelyWithSuffix(
                    stdout,
                    maxBashToolResponseSize / 3
                )
                const [stderrTrunc, stderrSuffix] = ExecuteBash.truncateSafelyWithSuffix(
                    stderr,
                    maxBashToolResponseSize / 3
                )

                const outputJson = {
                    exitStatus: exitStatus.toString(),
                    stdout: stdoutTrunc + (stdoutSuffix ? ' ... truncated' : ''),
                    stderr: stderrTrunc + (stderrSuffix ? ' ... truncated' : ''),
                }

                resolve({
                    output: {
                        kind: 'json',
                        content: outputJson,
                    },
                })
            } catch (err: any) {
                this.logger.error(`Failed to execute bash command '${params.command}': ${err.message}`)
                reject(new Error(`Failed to execute command: ${err.message}`))
            } finally {
                await writer?.close()
                writer?.releaseLock()
            }
        })
    }

    private static handleChunk(chunk: string, buffer: string[], writer?: WritableStreamDefaultWriter<any>) {
        try {
            void writer?.write(chunk)
            const lines = chunk.split(/\r?\n/)
            for (const line of lines) {
                buffer.push(line)
                if (buffer.length > lineCount) {
                    buffer.shift()
                }
            }
        } catch (error) {
            // Log the error but don't let it crash the process
            throw new Error('Error handling output chunk')
        }
    }

    private static truncateSafelyWithSuffix(str: string, maxLength: number): [string, boolean] {
        if (str.length > maxLength) {
            return [str.substring(0, maxLength), true]
        }
        return [str, false]
    }

    private static async whichCommand(logger: Logging, cmd: string): Promise<string> {
        // use 'command -v' instead as which isn't POSIX
        const cp = new processUtils.ChildProcess(logger, 'command', ['-v', cmd], {
            collect: true,
            waitForStreams: true,
        })
        const result = await cp.run()

        if (result.exitCode !== 0) {
            throw new Error(`Command '${cmd}' not found on PATH.`)
        }

        const output = result.stdout.trim()
        if (!output) {
            throw new Error(`Command '${cmd}' found but 'which' returned empty output.`)
        }
        return output
    }

    public queueDescription(command: string): string {
        const description = ''
        description.concat(`I will run the following shell command:\n`)
        description.concat('```bash\n' + command + '\n```')
        return description
    }

    public getSpec() {
        return {
            name: 'executeBash',
            description: 'Execute the specified bash command.',
            inputSchema: {
                type: 'object',
                properties: {
                    command: {
                        type: 'string',
                        description: 'Bash command to execute',
                    },
                    cwd: {
                        type: 'string',
                        description: 'Parameter to set the current working directory for the bash command.',
                    },
                },
                required: ['command', 'cwd'],
            },
        } as const
    }
}
