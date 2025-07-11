/**
 * Shared image verification utilities for AWS LSP packages
 * Provides consistent image validation across client and server components
 * This is a standalone version that doesn't depend on Node.js modules
 */

export const MAX_IMAGE_CONTEXT: number = 20

export interface ImageVerificationResult {
    isValid: boolean
    errors: string[]
}

export interface ImageVerificationOptions {
    maxSizeBytes?: number
    maxDimension?: number
    supportedExtensions?: string[]
}

export const DEFAULT_IMAGE_VERIFICATION_OPTIONS: Required<ImageVerificationOptions> = {
    maxSizeBytes: 3.75 * 1024 * 1024, // 3.75MB
    maxDimension: 8000, // 8000px
    supportedExtensions: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
}

/**
 * Verifies if a file extension is supported for images
 */
export function isSupportedImageExtension(extension: string): boolean {
    const ext = extension.toLowerCase().replace('.', '')
    return DEFAULT_IMAGE_VERIFICATION_OPTIONS.supportedExtensions.includes(ext)
}

/**
 * Verifies if a file size is within acceptable limits
 */
export function isFileSizeValid(fileSize: number, maxSizeBytes?: number): boolean {
    const maxSize = maxSizeBytes ?? DEFAULT_IMAGE_VERIFICATION_OPTIONS.maxSizeBytes
    return fileSize <= maxSize
}

/**
 * Verifies if image dimensions are within acceptable limits
 */
export function areImageDimensionsValid(width: number, height: number, maxDimension?: number): boolean {
    const maxDim = maxDimension ?? DEFAULT_IMAGE_VERIFICATION_OPTIONS.maxDimension
    return width <= maxDim && height <= maxDim
}

/**
 * Client-side image verification for File objects (browser environment)
 */
export async function verifyClientImage(file: File, fileName: string): Promise<ImageVerificationResult> {
    const opts = DEFAULT_IMAGE_VERIFICATION_OPTIONS
    const errors: string[] = []

    // Check file extension
    const extension = fileName.split('.').pop()?.toLowerCase() || ''
    if (!isSupportedImageExtension(extension)) {
        errors.push(`${fileName}: File must be an image in JPEG, PNG, GIF, or WebP format.`)
        return { isValid: false, errors }
    }

    // Check file size
    if (!isFileSizeValid(file.size, opts.maxSizeBytes)) {
        errors.push(
            `${fileName}: Image must be no more than ${(opts.maxSizeBytes / (1024 * 1024)).toFixed(2)}MB in size.`
        )
        return { isValid: false, errors }
    }

    // Check image dimensions
    try {
        const dimensions = await getClientImageDimensions(file)
        if (!areImageDimensionsValid(dimensions.width, dimensions.height, opts.maxDimension)) {
            errors.push(`${fileName}: Image must be no more than ${opts.maxDimension}px in width or height.`)
            return { isValid: false, errors }
        }
    } catch (error) {
        errors.push(`${fileName}: Unable to read image dimensions.`)
        return { isValid: false, errors }
    }

    return { isValid: true, errors: [] }
}

/**
 * Batch verification for multiple client files
 */
export async function verifyClientImages(files: FileList): Promise<{ validFiles: File[]; errors: string[] }> {
    const validFiles: File[] = []
    const errors: string[] = []

    for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileName = file.name || 'Unknown file'

        const result = await verifyClientImage(file, fileName)
        if (result.isValid) {
            validFiles.push(file)
        } else {
            errors.push(...result.errors)
        }
    }

    return { validFiles, errors }
}

async function getClientImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        const objectUrl = URL.createObjectURL(file)

        img.onload = () => {
            URL.revokeObjectURL(objectUrl)
            resolve({ width: img.width, height: img.height })
        }

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl)
            // Fall back to FileReader if ObjectURL fails
            const reader = new FileReader()

            reader.onload = e => {
                const fallbackImg = new Image()

                fallbackImg.onload = () => {
                    resolve({ width: fallbackImg.width, height: fallbackImg.height })
                }

                fallbackImg.onerror = () => {
                    reject(new Error('Failed to load image'))
                }

                if (e.target?.result) {
                    fallbackImg.src = e.target.result as string
                } else {
                    reject(new Error('Failed to read image file'))
                }
            }

            reader.onerror = reject
            reader.readAsDataURL(file)
        }

        img.src = objectUrl
    })
}
