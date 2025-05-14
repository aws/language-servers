const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const SCRIPT_DIR = __dirname
const ROOT_DIR = path.resolve(SCRIPT_DIR, '../../../')
const CHAT_CLIENT_PATH = path.resolve(ROOT_DIR, 'chat-client')
const CODE_WHISPERER_RUNTIMES_PATH = path.resolve(ROOT_DIR, 'app/aws-lsp-codewhisperer-runtimes')
const CUSTOM_WEBPACK_PATH = path.join(SCRIPT_DIR, '../custom-webpack-config.js')

function executeCommand(command, cwd) {
    try {
        console.log(`Executing: ${command}`)
        execSync(`${command}`, {
            cwd,
            stdio: 'pipe',
        })
    } catch (error) {
        console.error(`Error executing command "${command}": ${error.message}`)
        if (error.signal === 'SIGINT' || error.signal === 'SIGTERM') {
            cleanupInterruptedState()
        }
        if (error.message.includes('Command failed: npm run clean')) {
            // ignore this error as it is expected to fail in case clean is run without install
            return
        }
        process.exit(1)
    }
}

function handleWebpackConfig(action) {
    const webpackPath = path.join(SCRIPT_DIR, '../webpack.config.js')
    const backupPath = path.join(SCRIPT_DIR, '../webpack.config.js.backup')

    if (action === 'backup' && fs.existsSync(webpackPath)) {
        fs.renameSync(webpackPath, backupPath)
        fs.copyFileSync(CUSTOM_WEBPACK_PATH, webpackPath)
    } else if (action === 'restore' && fs.existsSync(backupPath)) {
        if (fs.existsSync(webpackPath)) {
            fs.unlinkSync(webpackPath)
        }
        fs.renameSync(backupPath, webpackPath)
    }
}

function cleanupInterruptedState() {
    const webpackPath = path.join(SCRIPT_DIR, '../webpack.config.js')
    const backupPath = path.join(SCRIPT_DIR, '../webpack.config.js.backup')

    if (fs.existsSync(backupPath)) {
        console.log('Found backup webpack config from previous interrupted run. Restoring...')
        if (fs.existsSync(webpackPath)) {
            fs.unlinkSync(webpackPath)
        }
        fs.renameSync(backupPath, webpackPath)
        console.log('Restored original webpack config.')
    }
}

function createServerArtifact() {
    try {
        // Clean up any interrupted state from previous runs
        cleanupInterruptedState()

        if (!fs.existsSync(ROOT_DIR)) {
            throw new Error(`Directory not found: ${ROOT_DIR}`)
        }

        if (!fs.existsSync(CUSTOM_WEBPACK_PATH)) {
            throw new Error(`Custom webpack config not found: ${CUSTOM_WEBPACK_PATH}`)
        }

        console.log('\nStep 1: Running clean in root directory...')
        executeCommand('npm run clean', ROOT_DIR)

        console.log('\nStep 2: Installing dependencies in root directory...')
        executeCommand('npm i', ROOT_DIR)

        console.log('\nStep 3: Running compile in root directory...')
        executeCommand('npm run compile', ROOT_DIR)

        console.log('\nStep 4: Running package in target directory...')

        handleWebpackConfig('backup')

        try {
            executeCommand('npm run package', CODE_WHISPERER_RUNTIMES_PATH)
        } finally {
            handleWebpackConfig('restore')
        }

        console.log('\nServer artifact created successfully! 🎉')
    } catch (error) {
        console.error('\nServer artifact creation failed:', error.message)
        process.exit(1)
    }
}

function createClientArtifact() {
    try {
        if (!fs.existsSync(CHAT_CLIENT_PATH)) {
            throw new Error(`Chat client path not found: ${CHAT_CLIENT_PATH}`)
        }
        executeCommand('npm run compile', CHAT_CLIENT_PATH)
        console.log('\nClient artifact created successfully! 🎉')
    } catch (error) {
        console.error('\nClient artifact creation failed:', error.message)
        process.exit(1)
    }
}

try {
    createServerArtifact()
    createClientArtifact()
    console.log(
        '\nServer artifact created at: language-servers/app/aws-lsp-codewhisperer-runtimes/build/aws-lsp-codewhisperer.js'
    )
    console.log('\nClient artifact created at: language-servers/chat-client/build/amazonq-ui.js')
} catch (er) {
    console.error('\nArtifacts creation failed:', er.message)
    process.exit(1)
}
