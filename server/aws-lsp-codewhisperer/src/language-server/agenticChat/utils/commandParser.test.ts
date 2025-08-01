/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert'
import { parseBaseCommands } from './commandParser'

describe('commandParser', () => {
    describe('parseBaseCommands', () => {
        it('should extract base command from a simple command', () => {
            assert.deepStrictEqual(parseBaseCommands('cd /home/user/documents'), ['cd'])
        })

        it('should extract multiple commands separated by &&', () => {
            assert.deepStrictEqual(parseBaseCommands('echo "Hello World" && ls -la'), ['echo', 'ls'])
        })

        it('should extract multiple commands separated by ||', () => {
            assert.deepStrictEqual(parseBaseCommands('grep "pattern" file.txt || echo "Not found"'), ['grep', 'echo'])
        })

        it('should extract multiple commands separated by |', () => {
            assert.deepStrictEqual(parseBaseCommands('cat file.txt | grep "pattern"'), ['cat', 'grep'])
        })

        it('should handle commands with quotes', () => {
            assert.deepStrictEqual(
                parseBaseCommands('echo "text with spaces" && grep "pattern with spaces" file.txt'),
                ['echo', 'grep']
            )
        })

        it('should return empty array for null, undefined, empty input', () => {
            assert.deepStrictEqual(parseBaseCommands(null as any), [])
            assert.deepStrictEqual(parseBaseCommands(undefined as any), [])
            assert.deepStrictEqual(parseBaseCommands(''), [])
        })

        it('should handle commands with semicolons', () => {
            assert.deepStrictEqual(parseBaseCommands('cd /tmp; ls -la; echo "done"'), ['cd', 'ls', 'echo'])
        })

        it('should handle commands with sudo prefix', () => {
            assert.deepStrictEqual(parseBaseCommands('sudo apt-get install package'), ['sudo', 'apt-get'])
            assert.deepStrictEqual(parseBaseCommands('sudo -u user command'), ['sudo', 'command'])
        })

        it('should handle commands with time prefix', () => {
            assert.deepStrictEqual(parseBaseCommands('time curl http://example.com'), ['time', 'curl'])
        })

        it('should handle commands with path prefixes', () => {
            assert.deepStrictEqual(parseBaseCommands('/usr/bin/python script.py'), ['python'])
            assert.deepStrictEqual(parseBaseCommands('./script.sh -arg'), ['script.sh'])
            assert.deepStrictEqual(parseBaseCommands('../bin/tool --option'), ['tool'])
        })

        it('should handle commands with sudo and path prefixes', () => {
            assert.deepStrictEqual(parseBaseCommands('sudo /usr/bin/apt-get update'), ['sudo', 'apt-get'])
        })

        it('should handle multiple commands with mixed separators', () => {
            assert.deepStrictEqual(parseBaseCommands('cd /tmp; ls -la | grep "file" && echo "found"'), [
                'cd',
                'ls',
                'grep',
                'echo',
            ])
        })

        it('should handle commands with other common prefixes', () => {
            assert.deepStrictEqual(parseBaseCommands('nice -n 10 command'), ['nice', 'command'])
            assert.deepStrictEqual(parseBaseCommands('nohup command &'), ['nohup', 'command'])
        })

        it('should handle commands with function calls', () => {
            assert.deepStrictEqual(parseBaseCommands('function_name args'), ['function_name'])
        })
    })
})
