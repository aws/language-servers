import * as assert from 'assert'
import * as sinon from 'sinon'
import {
    isSupportedImageExtension,
    isFileSizeValid,
    areImageDimensionsValid,
    verifyClientImage,
    verifyClientImages,
    DEFAULT_IMAGE_VERIFICATION_OPTIONS,
    MAX_IMAGE_CONTEXT,
} from './imageVerification'

class MockImage {
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    width = 800
    height = 600
    _src = ''
    get src() {
        return this._src
    }
    set src(value: string) {
        this._src = value
        // Simulate image loading
        Promise.resolve().then(() => this.onload?.())
    }
}

class MockFileReader {
    onload: ((event: any) => void) | null = null
    onerror: (() => void) | null = null
    result: string | ArrayBuffer | null = null
    readAsDataURL(file: File) {
        setTimeout(() => {
            this.result = 'data:image/png;base64,mock-data'
            this.onload?.({ target: { result: this.result } })
        }, 0)
    }
}

describe('imageVerification', () => {
    let imageStub: sinon.SinonStub
    let urlStub: sinon.SinonStub
    let fileReaderStub: sinon.SinonStub

    beforeEach(() => {
        imageStub = sinon.stub(global, 'Image').callsFake(() => new MockImage())
        urlStub = sinon.stub(global, 'URL').value({
            createObjectURL: sinon.stub().returns('blob:mock-url'),
            revokeObjectURL: sinon.stub(),
        })
        fileReaderStub = sinon.stub(global, 'FileReader').callsFake(() => new MockFileReader())
    })

    afterEach(() => {
        sinon.restore()
    })

    describe('constants', () => {
        it('has correct MAX_IMAGE_CONTEXT value', () => {
            assert.equal(MAX_IMAGE_CONTEXT, 20)
        })

        it('has correct default options', () => {
            assert.equal(DEFAULT_IMAGE_VERIFICATION_OPTIONS.maxSizeBytes, 3.75 * 1024 * 1024)
            assert.equal(DEFAULT_IMAGE_VERIFICATION_OPTIONS.maxDimension, 8000)
            assert.deepEqual(DEFAULT_IMAGE_VERIFICATION_OPTIONS.supportedExtensions, [
                'jpeg',
                'jpg',
                'png',
                'gif',
                'webp',
            ])
        })
    })

    describe('isSupportedImageExtension', () => {
        it('returns true for supported extensions', () => {
            assert.equal(isSupportedImageExtension('jpg'), true)
            assert.equal(isSupportedImageExtension('jpeg'), true)
            assert.equal(isSupportedImageExtension('png'), true)
            assert.equal(isSupportedImageExtension('gif'), true)
            assert.equal(isSupportedImageExtension('webp'), true)
        })

        it('returns true for supported extensions with dots', () => {
            assert.equal(isSupportedImageExtension('.jpg'), true)
            assert.equal(isSupportedImageExtension('.png'), true)
        })

        it('returns true for uppercase extensions', () => {
            assert.equal(isSupportedImageExtension('JPG'), true)
            assert.equal(isSupportedImageExtension('PNG'), true)
        })

        it('returns false for unsupported extensions', () => {
            assert.equal(isSupportedImageExtension('txt'), false)
            assert.equal(isSupportedImageExtension('pdf'), false)
            assert.equal(isSupportedImageExtension('doc'), false)
        })
    })

    describe('isFileSizeValid', () => {
        it('returns true for valid file sizes', () => {
            assert.equal(isFileSizeValid(1024), true) // 1KB
            assert.equal(isFileSizeValid(1024 * 1024), true) // 1MB
        })

        it('returns false for oversized files', () => {
            const maxSize = DEFAULT_IMAGE_VERIFICATION_OPTIONS.maxSizeBytes
            assert.equal(isFileSizeValid(maxSize + 1), false)
        })

        it('accepts custom max size', () => {
            assert.equal(isFileSizeValid(2048, 1024), false)
            assert.equal(isFileSizeValid(512, 1024), true)
        })
    })

    describe('areImageDimensionsValid', () => {
        it('returns true for valid dimensions', () => {
            assert.equal(areImageDimensionsValid(800, 600), true)
            assert.equal(areImageDimensionsValid(1920, 1080), true)
        })

        it('returns false for oversized dimensions', () => {
            const maxDim = DEFAULT_IMAGE_VERIFICATION_OPTIONS.maxDimension
            assert.equal(areImageDimensionsValid(maxDim + 1, 600), false)
            assert.equal(areImageDimensionsValid(800, maxDim + 1), false)
        })

        it('accepts custom max dimension', () => {
            assert.equal(areImageDimensionsValid(1200, 800, 1000), false)
            assert.equal(areImageDimensionsValid(800, 600, 1000), true)
        })
    })

    describe('verifyClientImage', () => {
        let mockFile: File

        beforeEach(() => {
            mockFile = {
                name: 'test.jpg',
                size: 1024 * 1024, // 1MB
                type: 'image/jpeg',
            } as File
        })

        it('validates a correct image file', async () => {
            const result = await verifyClientImage(mockFile, 'test.jpg')
            assert.equal(result.isValid, true)
            assert.equal(result.errors.length, 0)
        })

        it('rejects unsupported file extension', async () => {
            const result = await verifyClientImage(mockFile, 'test.txt')
            assert.equal(result.isValid, false)
            assert.equal(result.errors.length, 1)
            assert.ok(result.errors[0].includes('File must be an image'))
        })

        it('rejects oversized files', async () => {
            const largeFile = {
                ...mockFile,
                size: DEFAULT_IMAGE_VERIFICATION_OPTIONS.maxSizeBytes + 1,
            } as File

            const result = await verifyClientImage(largeFile, 'large.jpg')
            assert.equal(result.isValid, false)
            assert.equal(result.errors.length, 1)
            assert.ok(result.errors[0].includes('must be no more than'))
        })

        it('rejects images with oversized dimensions', async () => {
            // Stub Image to return oversized dimensions
            imageStub.callsFake(() => ({
                onload: null,
                onerror: null,
                width: DEFAULT_IMAGE_VERIFICATION_OPTIONS.maxDimension + 1,
                height: 600,
                _src: '',
                get src() {
                    return this._src
                },
                set src(value: string) {
                    this._src = value
                    Promise.resolve().then(() => this.onload?.())
                },
            }))

            const result = await verifyClientImage(mockFile, 'oversized.jpg')
            assert.equal(result.isValid, false)
            assert.equal(result.errors.length, 1)
            assert.ok(result.errors[0].includes('must be no more than'))
        })

        it('handles image loading errors', async () => {
            // Stub Image to fail loading
            imageStub.callsFake(() => ({
                onload: null,
                onerror: null,
                width: 0,
                height: 0,
                _src: '',
                get src() {
                    return this._src
                },
                set src(value: string) {
                    this._src = value
                    Promise.resolve().then(() => this.onerror?.())
                },
            }))

            // Stub FileReader to also fail
            fileReaderStub.callsFake(() => ({
                onload: null,
                onerror: null,
                result: null,
                readAsDataURL() {
                    setTimeout(() => this.onerror?.(), 0)
                },
            }))

            const result = await verifyClientImage(mockFile, 'failing.jpg')
            assert.equal(result.isValid, false)
            assert.equal(result.errors.length, 1)
            assert.ok(result.errors[0].includes('Unable to read image dimensions'))
        })
    })

    describe('verifyClientImages', () => {
        let mockFileList: FileList

        beforeEach(() => {
            const validFile = {
                name: 'valid.jpg',
                size: 1024 * 1024,
                type: 'image/jpeg',
            } as File

            const invalidFile = {
                name: 'invalid.txt',
                size: 1024,
                type: 'text/plain',
            } as File

            mockFileList = {
                length: 2,
                0: validFile,
                1: invalidFile,
                item: (index: number) => (index === 0 ? validFile : invalidFile),
            } as unknown as FileList
        })

        it('separates valid and invalid files', async () => {
            const result = await verifyClientImages(mockFileList)
            assert.equal(result.validFiles.length, 1)
            assert.equal(result.errors.length, 1)
            assert.equal(result.validFiles[0].name, 'valid.jpg')
            assert.ok(result.errors[0].includes('invalid.txt'))
        })

        it('handles empty file list', async () => {
            const emptyFileList = {
                length: 0,
                item: () => null,
            } as unknown as FileList

            const result = await verifyClientImages(emptyFileList)
            assert.equal(result.validFiles.length, 0)
            assert.equal(result.errors.length, 0)
        })

        it('handles files without names', async () => {
            const fileWithoutName = {
                name: '',
                size: 1024,
                type: 'image/jpeg',
            } as File

            const fileListWithUnnamed = {
                length: 1,
                0: fileWithoutName,
                item: () => fileWithoutName,
            } as unknown as FileList

            const result = await verifyClientImages(fileListWithUnnamed)
            // File without extension should be rejected
            assert.equal(result.validFiles.length, 0)
            assert.equal(result.errors.length, 1)
            assert.ok(result.errors[0].includes('Unknown file'))
        })
    })
})
