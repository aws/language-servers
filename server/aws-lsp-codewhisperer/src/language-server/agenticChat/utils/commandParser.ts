import { splitOperators } from '../tools/executeBash'

/**
 * Parses command arguments and extracts only the base commands without arguments or options.
 *
 * Examples:
 * - "cd /home/user/documents" -> ["cd"]
 * - "echo 'Hello World' && ls -la" -> ["echo", "ls"]
 * - "sudo apt-get install" -> ["sudo", "apt-get"]
 * - "time curl http://example.com" -> ["time", "curl"]
 * - "command1; command2" -> ["command1", "command2"]
 * - "/usr/bin/python script.py" -> ["python"]
 * - "./script.sh" -> ["script.sh"]
 * - "function_name args" -> ["function_name"]
 *
 * @param args Array of command arguments
 * @returns Array of base commands found in the input args
 */
export function parseBaseCommands(args: string[]): string[] {
    if (!args || !Array.isArray(args) || args.length === 0) {
        return []
    }

    const baseCommands: string[] = []

    // Process the args to extract base commands
    let i = 0
    let expectCommand = true // Flag to indicate we're expecting a command

    while (i < args.length) {
        const arg = args[i]

        // Check if this arg is an operator or contains an operator
        if (splitOperators.has(arg) || arg.includes(';')) {
            expectCommand = true // Next argument should be a command
            i++
            continue
        }

        if (expectCommand) {
            // Extract the base command
            let baseCommand = arg

            // Handle path prefixes (/usr/bin/command or ./command)
            if (baseCommand.includes('/')) {
                baseCommand = baseCommand.split('/').pop() || baseCommand
            }

            baseCommands.push(baseCommand)

            // Special case for sudo, time, etc. - include the actual command too
            if (['sudo', 'time', 'nice', 'nohup', 'env'].includes(baseCommand)) {
                // Skip any flags/options and their values
                let j = i + 1
                while (j < args.length) {
                    // If we find an operator, stop looking for the command
                    if (splitOperators.has(args[j]) || args[j].includes(';')) {
                        break
                    }

                    // Skip flag and its value if present
                    if (args[j].startsWith('-')) {
                        // Handle flags with values (e.g., -u user, -n 10)
                        if (
                            j + 1 < args.length &&
                            !args[j + 1].startsWith('-') &&
                            !splitOperators.has(args[j + 1]) &&
                            !args[j + 1].includes(';')
                        ) {
                            j += 2 // Skip both the flag and its value
                        } else {
                            j++ // Skip just the flag
                        }
                        continue
                    }

                    // Found the actual command
                    let nextCommand = args[j]

                    // Handle path prefixes for the command after sudo/time
                    if (nextCommand.includes('/')) {
                        nextCommand = nextCommand.split('/').pop() || nextCommand
                    }

                    baseCommands.push(nextCommand)
                    break
                }
            }

            // For all commands, we don't expect another command until we see an operator
            expectCommand = false
        }

        i++
    }

    return baseCommands
}
