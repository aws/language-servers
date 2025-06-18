/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { ChildProcess } from 'child_process'
import { Writable } from 'stream'

export class LspLogger {
    private logFile: fs.WriteStream | undefined
    private logPath: string = ''

    constructor() {
        // Get settings from environment variables
        const enabled = process.env.LSP_LOGGING_ENABLED === 'true'
        const customLogPath = process.env.LSP_LOG_PATH

        // If disabled, don't create log file
        if (!enabled) {
            return
        }

        // Determine log directory
        const logsDir = customLogPath || path.join(os.tmpdir(), 'vscode-lsp-logs')

        // Create directory if needed
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true })
        }

        // Create log file with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        this.logPath = path.join(logsDir, `lsp-log-${timestamp}.jsonl`)
        this.logFile = fs.createWriteStream(this.logPath)

        console.log(`LSP logging started to: ${this.logPath}`)
    }

    public wrapChildProcess(childProcess: ChildProcess): ChildProcess {
        if (!this.logFile) {
            return childProcess
        }

        // Intercept stdin
        if (childProcess.stdin) {
            const originalStdin = childProcess.stdin
            const logFile = this.logFile

            const stdinProxy = new Writable({
                write(chunk, encoding, callback) {
                    // Log outgoing messages
                    logFile.write(
                        JSON.stringify({
                            direction: 'client-to-server',
                            timestamp: new Date().toISOString(),
                            data: chunk.toString(),
                        }) + '\n'
                    )

                    // Forward to original stdin
                    originalStdin.write(chunk, encoding, callback)
                },
            })

            ;(childProcess as any).stdin = stdinProxy
        }

        // Intercept stdout
        if (childProcess.stdout) {
            const logFile = this.logFile
            childProcess.stdout.on('data', data => {
                logFile.write(
                    JSON.stringify({
                        direction: 'server-to-client',
                        timestamp: new Date().toISOString(),
                        data: data.toString(),
                    }) + '\n'
                )
            })
        }

        // Intercept stderr
        if (childProcess.stderr) {
            const logFile = this.logFile
            childProcess.stderr.on('data', data => {
                logFile.write(
                    JSON.stringify({
                        direction: 'server-error',
                        timestamp: new Date().toISOString(),
                        data: data.toString(),
                    }) + '\n'
                )
            })
        }

        return childProcess
    }

    public dispose(): void {
        if (this.logFile) {
            this.logFile.end()
            console.log(`LSP logging completed: ${this.logPath}`)
        }
    }
}
