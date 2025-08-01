import { splitOperators } from '../tools/executeBash'
import { split } from 'shlex'

/**
 * Parses a command string and extracts only the base commands without arguments or options.
 *
 * Examples:
 * - "cd /home/user/documents" -> ["cd"]
 * - "echo 'Hello World' && ls -la" -> ["echo", "ls"]
 * - "sudo apt-get install" -> ["sudo", "apt-get"]
 * - "time curl http://example.com" -> ["time", "curl"]
 * - "cd /tmp; ls -la; echo done" -> ["cd", "ls", "echo"]
 * - "/usr/bin/python script.py" -> ["python"]
 * - "./script.sh" -> ["script.sh"]
 * - "function_name args" -> ["function_name"]
 *
 * @param commandString The full command string to parse
 * @returns Array of base commands found in the string
 */
export function parseBaseCommands(commandString: string): string[] {
    if (!commandString || typeof commandString !== 'string') {
        return []
    }

    const baseCommands: string[] = []

    // First split by semicolons (;) which separate commands
    const semicolonSegments = commandString.split(/\s*;\s*/).filter(Boolean)

    for (const semicolonSegment of semicolonSegments) {
        // Split by operators (&&, ||, |, >) but filter out the operators themselves
        const operatorRegex = new RegExp(
            `\\s*(${Array.from(splitOperators)
                .map(op => op.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&'))
                .join('|')})\\s*`
        )
        const commandSegments = semicolonSegment.split(operatorRegex).filter(segment => {
            const trimmed = segment.trim()
            return trimmed && !splitOperators.has(trimmed)
        })

        // Process each command segment
        for (const segment of commandSegments) {
            const trimmedSegment = segment.trim()
            if (!trimmedSegment) continue

            // Use shlex.split to properly handle quoted arguments
            const args = split(trimmedSegment)
            if (args.length > 0) {
                const command = extractBaseCommandFromArgs(args)
                if (command) {
                    baseCommands.push(...command)
                }
            }
        }
    }

    return baseCommands
}

/**
 * Extracts base commands from parsed arguments (when shlex parsing succeeds).
 * Handles path prefixes and prefix commands like sudo, time, nice, nohup, env.
 * For prefix commands, attempts to find and include the actual command being executed.
 */
function extractBaseCommandFromArgs(args: string[]): string[] | null {
    if (args.length === 0) return null

    const commands: string[] = []

    // Extract the base command (first argument)
    let baseCommand = args[0]

    // Handle path prefixes (/usr/bin/command or ./command)
    if (baseCommand.includes('/')) {
        baseCommand = baseCommand.split('/').pop() || baseCommand
    }

    commands.push(baseCommand)

    // Special case for prefix commands - find the actual command they're running
    if (['sudo', 'time', 'nice', 'nohup', 'env'].includes(baseCommand)) {
        // Note: This doesn't handle nested prefix commands (e.g., "sudo time curl") but such cases are rare enough
        const actualCommand = findActualCommand(args, 1)
        if (actualCommand) {
            commands.push(actualCommand)
        }
    }

    return commands.length > 0 ? commands : null
}

/**
 * Finds the actual command after prefix commands like sudo, time, nice, etc.
 * Skips over flags and their values to locate the first non-prefix command.
 * Note: Does not handle nested prefix commands (e.g., "sudo time curl" -> only finds first non-prefix).
 */
function findActualCommand(args: string[], startIndex: number): string | null {
    // Skip over flags and options to find the actual command
    for (let i = startIndex; i < args.length; i++) {
        const arg = args[i]

        // Skip flags (starting with -)
        if (arg.startsWith('-')) {
            // Some flags take values, skip the next argument too if it doesn't start with -
            if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
                i++ // Skip the flag value
            }
            continue
        }

        // This should be the actual command
        let command = arg
        if (command.includes('/')) {
            command = command.split('/').pop() || command
        }

        return command
    }

    return null
}
