const { parentPort } = require('worker_threads')
const fs = require('fs')

const uniqueFiles = new Set()
let filesExceedingMaxSize = 0
let maxFileSize
let remainingIndexSize

function getFileExtensionName(filepath) {
    if (!filepath || !filepath.includes('.') || filepath.endsWith('.')) {
        return ''
    }
    if (filepath.startsWith('.') && filepath.indexOf('.', 1) === -1) {
        return ''
    }
    return filepath.substring(filepath.lastIndexOf('.') + 1).toLowerCase()
}

parentPort.on('message', message => {
    const { type, data } = message

    try {
        if (type === 'init') {
            const { maxFileSizeMB, maxIndexSizeMB } = data
            const MB_TO_BYTES = 1024 * 1024
            maxFileSize = maxFileSizeMB * MB_TO_BYTES
            remainingIndexSize = maxIndexSizeMB * MB_TO_BYTES
            parentPort.postMessage({ type: 'ready' })
        } else if (type === 'processBatch') {
            const { files, fileExtensions } = data

            for (const file of files) {
                const fileExtName = '.' + getFileExtensionName(file)
                if (!uniqueFiles.has(file) && fileExtensions.includes(fileExtName)) {
                    try {
                        const fileSize = fs.statSync(file).size
                        if (fileSize < maxFileSize) {
                            if (remainingIndexSize > fileSize) {
                                uniqueFiles.add(file)
                                remainingIndexSize -= fileSize
                            } else {
                                parentPort.postMessage({
                                    type: 'result',
                                    data: {
                                        files: [...uniqueFiles],
                                        filesExceedingMaxSize,
                                        reachedLimit: true,
                                    },
                                })
                                return
                            }
                        } else {
                            filesExceedingMaxSize++
                        }
                    } catch (error) {
                        // Skip files that can't be accessed
                    }
                }
            }

            parentPort.postMessage({ type: 'batchComplete' })
        } else if (type === 'complete') {
            parentPort.postMessage({
                type: 'result',
                data: {
                    files: [...uniqueFiles],
                    filesExceedingMaxSize,
                    reachedLimit: false,
                },
            })
        } else {
            parentPort.postMessage({
                type: 'error',
                error: `Unknown message type: ${type}`,
            })
        }
    } catch (error) {
        parentPort.postMessage({
            type: 'error',
            error: error.message,
        })
    }
})
