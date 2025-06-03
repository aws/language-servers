// Port from VSC https://github.com/aws/aws-toolkit-vscode/blob/741c2c481bcf0dca2d9554e32dc91d8514b1b1d1/packages/core/src/codewhispererChat/tools/executeBash.ts#L134

import { CommandValidation, ExplanatoryParams, InvokeOutput, isPathApproved } from './toolShared'
import { split } from 'shlex'
import { Logging } from '@aws/language-server-runtimes/server-interface'
import { CancellationError, processUtils, workspaceUtils } from '@aws/lsp-core'
import { CancellationToken } from 'vscode-languageserver'
import { ChildProcess, ChildProcessOptions } from '@aws/lsp-core/out/util/processUtils'
// eslint-disable-next-line import/no-nodejs-modules
import { isAbsolute, join } from 'path' // Safe to import on web since this is part of path-browserify
import { Features } from '../../types'
import { getWorkspaceFolderPaths } from '@aws/lsp-core/out/util/workspaceUtils'

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
export const maxToolResponseSize: number = 1024 * 1024 // 1MB
export const lineCount: number = 1024
export const destructiveCommandWarningMessage = 'WARNING: Potentially destructive command detected:\n\n'
export const mutateCommandWarningMessage = 'Mutation command:\n\n'
export const outOfWorkspaceWarningmessage = 'Execution out of workspace scope:\n\n'

/**
 * Parameters for executing a command on the system shell.
 * Works cross-platform: uses cmd.exe on Windows and bash on Unix-like systems.
 */
export interface ExecuteBashParams extends ExplanatoryParams {
    command: string
    cwd?: string
}

interface TimestampedChunk {
    timestamp: number
    isStdout: boolean
    content: string
    isFirst: boolean
}

/**
 * Output from executing a command on the system shell.
 * Format is consistent across platforms (Windows, macOS, Linux).
 */
export interface ExecuteBashOutput {
    exitStatus: string
    stdout: string
    stderr: string
}

/**
 * Static determination if the current platform should use Windows-style commands
 * true if the platform should use Windows command shell, false for Unix-like shells
 */
const IS_WINDOWS_PLATFORM = process.platform === 'win32'

export class ExecuteBash {
    private childProcess?: ChildProcess
    private readonly logging: Features['logging']
    private readonly workspace: Features['workspace']
    constructor(features: Pick<Features, 'logging' | 'workspace'> & Partial<Features>) {
        this.logging = features.logging
        this.workspace = features.workspace
    }

    public async validate(input: ExecuteBashParams): Promise<void> {
        const command = input.command
        if (!command.trim()) {
            throw new Error('Command cannot be empty.')
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
        ExecuteBash.handleChunk(chunk.content, buffer, writer)
    }

    public async requiresAcceptance(
        params: ExecuteBashParams,
        approvedPaths?: Set<string>
    ): Promise<CommandValidation> {
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

            // Track highest command category (ReadOnly < Mutate < Destructive)
            let highestCommandCategory = CommandCategory.ReadOnly

            for (const cmdArgs of allCommands) {
                if (cmdArgs.length === 0) {
                    return { requiresAcceptance: true, commandCategory: highestCommandCategory }
                }

                // For each command, validate arguments for path safety within workspace
                for (const arg of cmdArgs) {
                    if (this.looksLikePath(arg)) {
                        // Special handling for tilde paths in Unix-like systems
                        let fullPath: string
                        if (!IS_WINDOWS_PLATFORM && arg.startsWith('~')) {
                            // Treat tilde paths as absolute paths (they will be expanded by the shell)
                            return {
                                requiresAcceptance: true,
                                warning: destructiveCommandWarningMessage,
                                commandCategory: CommandCategory.Destructive,
                            }
                        } else if (!isAbsolute(arg) && params.cwd) {
                            // If not absolute, resolve using workingDirectory if available
                            fullPath = join(params.cwd, arg)
                        } else {
                            fullPath = arg
                        }

                        // Check if the path is already approved
                        if (approvedPaths && isPathApproved(fullPath, approvedPaths)) {
                            continue
                        }

                        const isInWorkspace = workspaceUtils.isInWorkspace(
                            getWorkspaceFolderPaths(this.workspace),
                            fullPath
                        )
                        if (!isInWorkspace) {
                            return {
                                requiresAcceptance: true,
                                warning: outOfWorkspaceWarningmessage,
                                commandCategory: highestCommandCategory,
                            }
                        }
                    }
                }

                const command = cmdArgs[0]
                const category = commandCategories.get(command)

                // Update the highest command category if current command has higher risk
                if (category === CommandCategory.Destructive) {
                    highestCommandCategory = CommandCategory.Destructive
                } else if (
                    category === CommandCategory.Mutate &&
                    highestCommandCategory !== CommandCategory.Destructive
                ) {
                    highestCommandCategory = CommandCategory.Mutate
                }

                switch (category) {
                    case CommandCategory.Destructive:
                        return {
                            requiresAcceptance: true,
                            warning: destructiveCommandWarningMessage,
                            commandCategory: CommandCategory.Destructive,
                        }
                    case CommandCategory.Mutate:
                        return {
                            requiresAcceptance: true,
                            warning: mutateCommandWarningMessage,
                            commandCategory: CommandCategory.Mutate,
                        }
                    case CommandCategory.ReadOnly:
                        continue
                    default:
                        return {
                            requiresAcceptance: true,
                            commandCategory: highestCommandCategory,
                        }
                }
            }
            // Finally, check if the cwd is outside the workspace
            if (params.cwd) {
                // Check if the cwd is already approved
                if (!(approvedPaths && isPathApproved(params.cwd, approvedPaths))) {
                    const workspaceFolders = getWorkspaceFolderPaths(this.workspace)

                    // If there are no workspace folders, we can't validate the path
                    if (!workspaceFolders || workspaceFolders.length === 0) {
                        return {
                            requiresAcceptance: true,
                            warning: outOfWorkspaceWarningmessage,
                            commandCategory: highestCommandCategory,
                        }
                    }

                    // Normalize paths for consistent comparison
                    const normalizedCwd = params.cwd.replace(/\\/g, '/')
                    const normalizedWorkspaceFolders = workspaceFolders.map(folder => folder.replace(/\\/g, '/'))

                    // Check if the normalized cwd is in any of the normalized workspace folders
                    const isInWorkspace = normalizedWorkspaceFolders.some(
                        folder => normalizedCwd === folder || normalizedCwd.startsWith(folder + '/')
                    )

                    if (!isInWorkspace) {
                        return {
                            requiresAcceptance: true,
                            warning: outOfWorkspaceWarningmessage,
                            commandCategory: highestCommandCategory,
                        }
                    }
                }
            }

            // If we've checked all commands and none required acceptance, we're good
            return { requiresAcceptance: false, commandCategory: highestCommandCategory }
        } catch (error) {
            this.logging.warn(`Error while checking acceptance: ${(error as Error).message}`)
            return { requiresAcceptance: true, commandCategory: CommandCategory.ReadOnly }
        }
    }

    private looksLikePath(arg: string): boolean {
        if (IS_WINDOWS_PLATFORM) {
            // Windows path patterns
            return (
                arg.startsWith('/') ||
                arg.startsWith('./') ||
                arg.startsWith('../') ||
                arg.startsWith('\\\\') || // UNC path
                arg.startsWith('.\\') ||
                arg.startsWith('..\\') ||
                /^[a-zA-Z]:[/\\]/.test(arg) ||
                arg.startsWith('%') // Windows environment variables like %USERPROFILE%
            ) // Drive letter paths like C:\ or C:/
        } else {
            // Unix path patterns
            return arg.startsWith('/') || arg.startsWith('./') || arg.startsWith('../') || arg.startsWith('~')
        }
    }

    // TODO: generalize cancellation logic for tools.
    public async invoke(
        params: ExecuteBashParams,
        cancellationToken?: CancellationToken,
        updates?: WritableStream
    ): Promise<InvokeOutput> {
        const { shellName, shellFlag } = IS_WINDOWS_PLATFORM
            ? { shellName: 'cmd.exe', shellFlag: '/c' }
            : { shellName: 'bash', shellFlag: '-c' }
        this.logging.info(`Invoking ${shellName} command: "${params.command}" in cwd: "${params.cwd}"`)

        return new Promise(async (resolve, reject) => {
            let finished = false
            const abort = (err: Error) => {
                if (!finished) {
                    finished = true
                    reject(err) // <─ propagate the error to caller
                }
            }

            // Check if cancelled before starting
            if (cancellationToken?.isCancellationRequested) {
                this.logging.debug('Command execution cancelled before starting')
                return abort(new CancellationError('user'))
            }

            this.logging.debug(
                `Spawning process with command: ${shellName} ${shellFlag} "${params.command}" (cwd=${params.cwd})`
            )

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
                        this.logging.debug('Command execution cancelled during stdout processing')
                        return abort(new CancellationError('user'))
                    }
                    const isFirst = getAndSetFirstChunk(false)
                    const timestamp = Date.now()
                    outputQueue.push({
                        timestamp,
                        isStdout: true,
                        content: IS_WINDOWS_PLATFORM ? ExecuteBash.decodeWinUtf(chunk) : chunk,
                        isFirst,
                    })
                    processQueue()
                },
                onStderr: async (chunk: string) => {
                    if (cancellationToken?.isCancellationRequested) {
                        this.logging.debug('Command execution cancelled during stderr processing')
                        return abort(new CancellationError('user'))
                    }
                    const isFirst = getAndSetFirstChunk(false)
                    const timestamp = Date.now()
                    outputQueue.push({
                        timestamp,
                        isStdout: false,
                        content: IS_WINDOWS_PLATFORM ? ExecuteBash.decodeWinUtf(chunk) : chunk,
                        isFirst,
                    })
                    processQueue()
                },
            }

            const shellArgs = IS_WINDOWS_PLATFORM
                ? ['/u', shellFlag, ...split(params.command)] // Windows: split for proper arg handling
                : [shellFlag, params.command]

            this.childProcess = new ChildProcess(this.logging, shellName, shellArgs, childProcessOptions)

            // Set up cancellation listener
            if (cancellationToken) {
                cancellationToken.onCancellationRequested(() => {
                    this.logging.debug('cancellation detected, killing child process')

                    // Kill the process
                    this.childProcess?.stop(false, 'SIGTERM')

                    // After a short delay, force kill with SIGKILL if still running
                    setTimeout(() => {
                        if (this.childProcess && !this.childProcess.stopped) {
                            this.logging.debug('Process still running after SIGTERM, sending SIGKILL')

                            // Try to kill the process group with SIGKILL
                            this.childProcess.stop(true, 'SIGKILL')
                        }
                    }, 500)
                    // Return from the function after cancellation
                    return abort(new CancellationError('user'))
                })
            }

            try {
                const result = await this.childProcess.run()

                // Check if cancelled after execution
                if (cancellationToken?.isCancellationRequested) {
                    this.logging.debug('Command execution cancelled after completion')
                    return abort(new CancellationError('user'))
                }

                const exitStatus = result.exitCode ?? 0
                const stdout = stdoutBuffer.join('\n')
                const stderr = stderrBuffer.join('\n')
                const success = exitStatus === 0 && !stderr
                const [stdoutTrunc, stdoutSuffix] = ExecuteBash.truncateSafelyWithSuffix(
                    stdout,
                    maxToolResponseSize / 3
                )
                const [stderrTrunc, stderrSuffix] = ExecuteBash.truncateSafelyWithSuffix(
                    stderr,
                    maxToolResponseSize / 3
                )

                const outputJson: ExecuteBashOutput = {
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
                    return abort(new CancellationError('user'))
                } else {
                    this.logging.error(`Failed to execute ${shellName} command '${params.command}': ${err.message}`)
                    reject(new Error(`Failed to execute command: ${err.message}`))
                }
            } finally {
                await writer?.close()
                writer?.releaseLock()
            }
        })
    }

    /**
     * Re‑creates the raw bytes from the received string (Buffer.from(text, 'binary')).
     * Detects UTF‑16 LE by checking whether every odd byte in the first 32 bytes is 0x00.
     * Decodes with buf.toString('utf16le') when the pattern matches, otherwise falls back to UTF‑8.
     */
    private static decodeWinUtf(raw: string): string {
        const buffer = Buffer.from(raw, 'binary')

        let utf16 = true
        for (let i = 1, n = Math.min(buffer.length, 32); i < n; i += 2) {
            if (buffer[i] !== 0x00) {
                utf16 = false
                break
            }
        }
        return utf16 ? buffer.toString('utf16le') : buffer.toString('utf8')
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

    private static async whichCommand(logger: Logging, cmd: string): Promise<void> {
        if (IS_WINDOWS_PLATFORM) {
            await this.resolveWindowsCommand(logger, cmd)
        } else {
            await this.resolveUnixCommand(logger, cmd)
        }
    }

    private static async resolveWindowsCommand(logger: Logging, cmd: string): Promise<void> {
        // 1. Check for external command or alias
        try {
            const whereProc = new processUtils.ChildProcess(logger, 'where', [cmd], {
                collect: true,
                waitForStreams: true,
            })
            const result = await whereProc.run()
            const output = result.stdout.trim()

            if (result.exitCode === 0 && output) {
                return
            }
        } catch (err) {
            logger.debug(`'where ${cmd}' failed: ${(err as Error).message}`)
        }

        // 2. Check for built-in command
        try {
            const helpProc = new processUtils.ChildProcess(logger, 'cmd.exe', ['/c', 'help', cmd], {
                collect: true,
                waitForStreams: true,
            })
            const result = await helpProc.run()
            const output = result.stdout.trim()

            if (output && !output.includes('This command is not supported by the help utility')) {
                return
            }
        } catch (err) {
            logger.debug(`'help ${cmd}' failed: ${(err as Error).message}`)
        }

        throw new Error(`Command '${cmd}' not found as executable or Windows built-in command`)
    }

    private static async resolveUnixCommand(logger: Logging, cmd: string): Promise<void> {
        try {
            const proc = new processUtils.ChildProcess(logger, 'sh', ['-c', `command -v ${cmd}`], {
                collect: true,
                waitForStreams: true,
            })
            const result = await proc.run()
            const output = result.stdout.trim()

            if (result.exitCode === 0 && output) {
                return
            }
        } catch (err) {
            logger.debug(`'command -v ${cmd}' failed: ${(err as Error).message}`)
        }

        throw new Error(`Command '${cmd}' not found as executable or shell built-in`)
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
            description:
                'Execute the specified command on the system shell (bash on Unix/Linux/macOS, cmd.exe on Windows).\n\n' +
                '## Overview\n' +
                "This tool executes commands on the user's system shell and returns the output.\n\n" +
                '## Operating System Specific Commands\n' +
                "- IMPORTANT: You MUST use commands specific to the user's current operating system. This tool will NOT adapt or translate commands between operating systems.\n" +
                "  - On Windows (cmd.exe): Use Windows-specific commands like 'dir', 'type', 'mkdir' (without -p flag).\n" +
                "  - On Unix/Linux/macOS (bash): Use Unix commands like 'ls', 'cat', 'mkdir -p'.\n" +
                '## When to use\n' +
                "- When you need to run system commands that aren't covered by specialized tools.\n" +
                '- When you need to interact with installed applications or utilities.\n' +
                '- When you need to perform operations that require shell capabilities.\n\n' +
                '## When not to use\n' +
                '- When specialized tools would be more appropriate for the task.\n' +
                '- When you need to perform file operations (use dedicated file tools instead).\n' +
                '- When you need to search through files (use dedicated search tools instead).\n\n' +
                '## Notes\n' +
                '- Output is limited to prevent overwhelming responses.\n',
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
                        description:
                            'Command to execute on the system shell. On Windows, this will run in cmd.exe; on Unix-like systems, this will run in bash.',
                    },
                    cwd: {
                        type: 'string',
                        description: 'Parameter to set the current working directory for the command execution.',
                    },
                },
                required: ['command', 'cwd'],
            },
        } as const
    }
}
