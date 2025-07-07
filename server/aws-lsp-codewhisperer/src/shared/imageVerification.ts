/**
 * Shared image verification utilities for AWS LSP packages
 * Provides consistent image validation across client and server components
 * This is a server-side version that works with Node.js Buffer objects
 */

import imageSize from 'image-size'

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
    supportedExtensions: ['jpeg', 'png', 'gif', 'webp'],
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
 * Server-side image verification for file paths and buffers (Node.js environment)
 */
export async function verifyServerImage(
    fileName: string,
    fileSize: number,
    imageBuffer: Buffer
): Promise<ImageVerificationResult> {
    const opts = DEFAULT_IMAGE_VERIFICATION_OPTIONS
    const errors: string[] = []

    // Check file extension
    const extension = fileName.split('.').pop()?.toLowerCase() || ''
    if (!isSupportedImageExtension(extension)) {
        errors.push(`${fileName}: File must be an image in JPEG, PNG, GIF, or WebP format.`)
        return { isValid: false, errors }
    }

    // Check file size
    if (!isFileSizeValid(fileSize, opts.maxSizeBytes)) {
        errors.push(
            `${fileName}: Image must be no more than ${(opts.maxSizeBytes / (1024 * 1024)).toFixed(2)}MB in size.`
        )
        return { isValid: false, errors }
    }

    // Check image dimensions
    try {
        const dimensions = getServerImageDimensions(imageBuffer)
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

// Helper function for server-side dimension reading
function getServerImageDimensions(buffer: Buffer): { width: number; height: number } {
    try {
        // Use the image-size library to parse the buffer and extract dimensions
        const dimensions = imageSize(buffer)

        if (!dimensions.width || !dimensions.height) {
            return {
                width: 0,
                height: 0,
            }
        }

        return {
            width: dimensions.width,
            height: dimensions.height,
        }
    } catch (error) {
        return {
            width: 0,
            height: 0,
        }
    }
}
