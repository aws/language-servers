// Port from VSC https://github.com/aws/aws-toolkit-vscode/blob/741c2c481bcf0dca2d9554e32dc91d8514b1b1d1/packages/core/src/codewhispererChat/tools/executeBash.ts#L134

import { CommandValidation, InvokeOutput } from './toolShared'
import { split } from 'shlex'
import { Logging } from '@aws/language-server-runtimes/server-interface'
import { processUtils, workspaceUtils } from '@aws/lsp-core'
import { CancellationToken } from 'vscode-languageserver'
import { ChildProcess, ChildProcessOptions } from '@aws/lsp-core/out/util/processUtils'
// eslint-disable-next-line import/no-nodejs-modules
import { isAbsolute, join } from 'path' // Safe to import on web since this is part of path-browserify
import { Features } from '../../types'

export enum CommandCategory {
    ReadOnly,
    Mutate,
    Destructive,
}

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
    ['wc', CommandCategory.ReadOnly],
    ['sort', CommandCategory.ReadOnly],
    ['diff', CommandCategory.ReadOnly],
    ['head', CommandCategory.ReadOnly],
    ['tail', CommandCategory.ReadOnly],

    // Mutable commands
    ['chmod', CommandCategory.Mutate],
    ['curl', CommandCategory.Mutate],
    ['mount', CommandCategory.Mutate],
    ['umount', CommandCategory.Mutate],
    ['systemctl', CommandCategory.Mutate],
    ['service', CommandCategory.Mutate],
    ['crontab', CommandCategory.Mutate],
    ['at', CommandCategory.Mutate],
    ['nc', CommandCategory.Mutate],
    ['ssh', CommandCategory.Mutate],
    ['scp', CommandCategory.Mutate],
    ['ftp', CommandCategory.Mutate],
    ['sftp', CommandCategory.Mutate],
    ['rsync', CommandCategory.Mutate],
    ['chroot', CommandCategory.Mutate],
    ['strace', CommandCategory.Mutate],
    ['gdb', CommandCategory.Mutate],
    ['apt', CommandCategory.Mutate],
    ['yum', CommandCategory.Mutate],
    ['dnf', CommandCategory.Mutate],
    ['pacman', CommandCategory.Mutate],
    ['exec', CommandCategory.Mutate],
    ['eval', CommandCategory.Mutate],
    ['xargs', CommandCategory.Mutate],

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
    ['kill', CommandCategory.Destructive],
    ['killall', CommandCategory.Destructive],
    ['pkill', CommandCategory.Destructive],
    ['iptables', CommandCategory.Destructive],
    ['route', CommandCategory.Destructive],
    ['chown', CommandCategory.Destructive],
])
export const maxBashToolResponseSize: number = 1024 * 1024 // 1MB
export const lineCount: number = 1024
export const destructiveCommandWarningMessage = '⚠️ WARNING: Destructive command detected:\n\n'
export const mutateCommandWarningMessage = 'Mutation command:\n\n'

export interface ExecuteBashParams {
    command: string
    cwd?: string
    explanation?: string
}

interface TimestampedChunk {
    timestamp: number
    isStdout: boolean
    content: string
    isFirst: boolean
}

export class ExecuteBash {
    private childProcess?: ChildProcess
    private readonly workspace: Features['workspace']
    private readonly logging: Features['logging']
    constructor(features: Pick<Features, 'logging' | 'workspace'> & Partial<Features>) {
        this.workspace = features.workspace
        this.logging = features.logging
    }

    public async validate(command: string): Promise<void> {
        if (!command.trim()) {
            throw new Error('Bash command cannot be empty.')
        }

        const args = split(command)
        if (!args || args.length === 0) {
            throw new Error('No command found.')
        }

        try {
            await ExecuteBash.whichCommand(this.logging, args[0])
        } catch {
            throw new Error(`Command '${args[0]}' not found on PATH.`)
        }
    }

    private static handleTimestampedChunk(
        chunk: TimestampedChunk,
        stdoutBuffer: string[],
        stderrBuffer: string[],
        writer?: WritableStreamDefaultWriter
    ): void {
        const buffer = chunk.isStdout ? stdoutBuffer : stderrBuffer
        const content = chunk.isFirst ? '```console\n' + chunk.content : chunk.content
        ExecuteBash.handleChunk(content, buffer, writer)
    }

    public async requiresAcceptance(params: ExecuteBashParams): Promise<CommandValidation> {
        try {
            const args = split(params.command)
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

                // For each command, validate arguments for path safety within workspace
                for (const arg of cmdArgs) {
                    if (this.looksLikePath(arg)) {
                        // If not absolute, resolve using workingDirectory if available.
                        const fullPath = !isAbsolute(arg) && params.cwd ? join(params.cwd, arg) : arg
                        const isInWorkspace = await workspaceUtils.inWorkspace(this.workspace, fullPath)
                        if (!isInWorkspace) {
                            return { requiresAcceptance: true, warning: destructiveCommandWarningMessage }
                        }
                    }
                }

                const command = cmdArgs[0]
                const category = commandCategories.get(command)

                switch (category) {
                    case CommandCategory.Destructive:
                        return { requiresAcceptance: true, warning: destructiveCommandWarningMessage }
                    case CommandCategory.Mutate:
                        return { requiresAcceptance: true, warning: mutateCommandWarningMessage }
                    case CommandCategory.ReadOnly:
                        continue
                    default:
                        return { requiresAcceptance: true }
                }
            }
            return { requiresAcceptance: false }
        } catch (error) {
            this.logging.warn(`Error while checking acceptance: ${(error as Error).message}`)
            return { requiresAcceptance: true }
        }
    }

    private looksLikePath(arg: string): boolean {
        return arg.startsWith('/') || arg.startsWith('./') || arg.startsWith('../')
    }

    // TODO: generalize cancellation logic for tools.
    public async invoke(
        params: ExecuteBashParams,
        updates?: WritableStream,
        cancellationToken?: CancellationToken
    ): Promise<InvokeOutput> {
        this.logging.info(`Invoking bash command: "${params.command}" in cwd: "${params.cwd}"`)

        return new Promise(async (resolve, reject) => {
            // Check if cancelled before starting
            if (cancellationToken?.isCancellationRequested) {
                this.logging.debug('Bash command execution cancelled before starting')
                reject(new Error('Command execution cancelled'))
                return
            }

            this.logging.debug(`Spawning process with command: bash -c "${params.command}" (cwd=${params.cwd})`)

            const stdoutBuffer: string[] = []
            const stderrBuffer: string[] = []

            // Use a closure boolean value firstChunk and a function to get and set its value
            let isFirstChunk = true
            const getAndSetFirstChunk = (newValue: boolean): boolean => {
                const oldValue = isFirstChunk
                isFirstChunk = newValue
                return oldValue
            }

            // Use a queue to maintain chronological order of chunks
            // This ensures that the output is processed in the exact order it was generated by the child process.
            const outputQueue: TimestampedChunk[] = []
            let processingQueue = false

            const writer = updates?.getWriter()
            // Process the queue in order
            const processQueue = () => {
                if (processingQueue || outputQueue.length === 0) {
                    return
                }

                processingQueue = true

                try {
                    // Sort by timestamp to ensure chronological order
                    outputQueue.sort((a, b) => a.timestamp - b.timestamp)

                    while (outputQueue.length > 0) {
                        const chunk = outputQueue.shift()!
                        ExecuteBash.handleTimestampedChunk(chunk, stdoutBuffer, stderrBuffer, writer)
                    }
                } finally {
                    processingQueue = false
                }
            }

            const childProcessOptions: ChildProcessOptions = {
                spawnOptions: {
                    cwd: params.cwd,
                    stdio: ['pipe', 'pipe', 'pipe'],
                },
                collect: false,
                waitForStreams: true,
                onStdout: async (chunk: string) => {
                    if (cancellationToken?.isCancellationRequested) {
                        this.logging.debug('Bash command execution cancelled during stderr processing')
                        return
                    }
                    const isFirst = getAndSetFirstChunk(false)
                    const timestamp = Date.now()
                    outputQueue.push({
                        timestamp,
                        isStdout: true,
                        content: chunk,
                        isFirst,
                    })
                    processQueue()
                },
                onStderr: async (chunk: string) => {
                    if (cancellationToken?.isCancellationRequested) {
                        this.logging.debug('Bash command execution cancelled during stderr processing')
                        return
                    }
                    const isFirst = getAndSetFirstChunk(false)
                    const timestamp = Date.now()
                    outputQueue.push({
                        timestamp,
                        isStdout: false,
                        content: chunk,
                        isFirst,
                    })
                    processQueue()
                },
            }

            this.childProcess = new ChildProcess(this.logging, 'bash', ['-c', params.command], childProcessOptions)

            // Set up cancellation listener
            if (cancellationToken) {
                cancellationToken.onCancellationRequested(() => {
                    this.logging.debug('Cancellation requested, killing child process')
                    this.childProcess?.stop()
                })
            }

            try {
                const result = await this.childProcess.run()

                // Check if cancelled after execution
                if (cancellationToken?.isCancellationRequested) {
                    this.logging.debug('Bash command execution cancelled after completion')
                    reject(new Error('Command execution cancelled'))
                    return
                }

                const exitStatus = result.exitCode ?? 0
                const stdout = stdoutBuffer.join('\n')
                const stderr = stderrBuffer.join('\n')
                const success = exitStatus === 0 && !stderr
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
                        success,
                    },
                })
            } catch (err: any) {
                // Check if this was due to cancellation
                if (cancellationToken?.isCancellationRequested) {
                    reject(new Error('Command execution cancelled'))
                } else {
                    this.logging.error(`Failed to execute bash command '${params.command}': ${err.message}`)
                    reject(new Error(`Failed to execute command: ${err.message}`))
                }
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
        const isWindows = process.platform === 'win32'
        const { command, args } = isWindows
            ? { command: 'where', args: [cmd] }
            : { command: 'sh', args: ['-c', `command -v ${cmd}`] }
        const cp = new processUtils.ChildProcess(logger, command, args, {
            collect: true,
            waitForStreams: true,
        })
        const result = await cp.run()

        if (result.exitCode !== 0) {
            throw new Error(`Command '${cmd}' not found on PATH.`)
        }

        const output = result.stdout.trim()
        if (!output) {
            throw new Error(`Command '${cmd}' found but '${command} ${args.join(' ')}' returned empty output.`)
        }
        return output
    }

    public async queueDescription(command: string, updates: WritableStream) {
        const writer = updates.getWriter()
        await writer.write('```shell\n' + command + '\n```')
        await writer.close()
        writer.releaseLock()
    }

    public getSpec() {
        return {
            name: 'executeBash',
            description: 'Execute the specified bash command.',
            inputSchema: {
                type: 'object',
                properties: {
                    explanation: {
                        type: 'string',
                        description:
                            'One sentence explanation as to why this tool is being used, and how it contributes to the goal.',
                    },
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
