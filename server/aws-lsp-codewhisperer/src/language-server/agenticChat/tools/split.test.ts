import { strict as assert } from 'assert'
import { split } from 'shlex'

describe('shlex.split for Windows command parsing', () => {
    it('should correctly split a git commit command with quotes', () => {
        const command = 'git commit -m "test commit"'
        const result = split(command)
        assert.deepEqual(result, ['git', 'commit', '-m', 'test commit'])
    })

    it('should handle AWS CLI commands with JSON payloads', () => {
        const command =
            'aws lambda invoke --function-name test --payload \'{"firstName": "John", "lastName": "Smith"}\' output.json'
        const result = split(command)
        assert.deepEqual(result, [
            'aws',
            'lambda',
            'invoke',
            '--function-name',
            'test',
            '--payload',
            '{"firstName": "John", "lastName": "Smith"}',
            'output.json',
        ])
    })

    it('should handle multiline commands', () => {
        const command = `aws lambda invoke \\
      --function-name test \\
      --payload '{"firstName": "John", "lastName": "Smith"}' \\
      output.json`
        const result = split(command)
        assert.deepEqual(result, [
            'aws',
            'lambda',
            'invoke',
            '--function-name',
            'test',
            '--payload',
            '{"firstName": "John", "lastName": "Smith"}',
            'output.json',
        ])
    })

    it('should handle PowerShell commands with complex quoting', () => {
        const command = 'powershell -Command "& {Get-Process | Where-Object {$_.CPU -gt 10}}"'
        const result = split(command)
        assert.deepEqual(result, ['powershell', '-Command', '& {Get-Process | Where-Object {$_.CPU -gt 10}}'])
    })

    it('should handle commands with environment variables', () => {
        const command = 'echo %PATH% && echo $HOME'
        const result = split(command)
        assert.deepEqual(result, ['echo', '%PATH%', '&&', 'echo', '$HOME'])
    })
})
