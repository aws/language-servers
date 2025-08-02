/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert'
import { parseBaseCommands } from './commandParser'
import { split } from 'shlex'

describe('commandParser', () => {
    describe('parseBaseCommands', () => {
        it('should extract base command from a simple command', () => {
            assert.deepStrictEqual(parseBaseCommands(split('cd /home/user/documents')), ['cd'])
        })

        it('should extract multiple commands separated by &&', () => {
            assert.deepStrictEqual(parseBaseCommands(split('echo "Hello World" && ls -la')), ['echo', 'ls'])
        })

        it('should extract multiple commands separated by ||', () => {
            assert.deepStrictEqual(parseBaseCommands(split('grep "pattern" file.txt || echo "Not found"')), [
                'grep',
                'echo',
            ])
        })

        it('should extract multiple commands separated by |', () => {
            assert.deepStrictEqual(parseBaseCommands(split('cat file.txt | grep "pattern"')), ['cat', 'grep'])
        })

        it('should handle commands with quotes', () => {
            assert.deepStrictEqual(
                parseBaseCommands(split('echo "text with spaces" && grep "pattern with spaces" file.txt')),
                ['echo', 'grep']
            )
        })

        it('should return empty array for null, undefined, empty input', () => {
            assert.deepStrictEqual(parseBaseCommands(null as any), [])
            assert.deepStrictEqual(parseBaseCommands(undefined as any), [])
            assert.deepStrictEqual(parseBaseCommands(split('')), [])
        })

        it('should handle commands with semicolons', () => {
            assert.deepStrictEqual(parseBaseCommands(split('cd /tmp; ls -la; echo "done"')), ['cd', 'ls', 'echo'])
        })

        it('should handle commands with sudo prefix', () => {
            assert.deepStrictEqual(parseBaseCommands(split('sudo apt-get install package')), ['sudo', 'apt-get'])
            assert.deepStrictEqual(parseBaseCommands(split('sudo -u user command')), ['sudo', 'command'])
        })

        it('should handle commands with time prefix', () => {
            assert.deepStrictEqual(parseBaseCommands(split('time curl http://example.com')), ['time', 'curl'])
        })

        it('should handle commands with path prefixes', () => {
            assert.deepStrictEqual(parseBaseCommands(split('/usr/bin/python script.py')), ['python'])
            assert.deepStrictEqual(parseBaseCommands(split('./script.sh -arg')), ['script.sh'])
            assert.deepStrictEqual(parseBaseCommands(split('../bin/tool --option')), ['tool'])
        })

        it('should handle commands with sudo and path prefixes', () => {
            assert.deepStrictEqual(parseBaseCommands(split('sudo /usr/bin/apt-get update')), ['sudo', 'apt-get'])
        })

        it('should handle multiple commands with mixed separators', () => {
            assert.deepStrictEqual(parseBaseCommands(split('cd /tmp; ls -la | grep "file" && echo "found"')), [
                'cd',
                'ls',
                'grep',
                'echo',
            ])
        })

        it('should handle commands with other common prefixes', () => {
            assert.deepStrictEqual(parseBaseCommands(split('nice -n 10 command')), ['nice', 'command'])
            assert.deepStrictEqual(parseBaseCommands(split('nohup command &')), ['nohup', 'command'])
        })

        it('should handle commands with function calls', () => {
            assert.deepStrictEqual(parseBaseCommands(split('function_name args')), ['function_name'])
        })
    })
})
