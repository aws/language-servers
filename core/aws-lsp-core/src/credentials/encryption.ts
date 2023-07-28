export function shouldWaitForEncryptionKey(): boolean {
    return process.argv.some(arg => arg === '--pre-init-encryption')
}

/**
 * Servers expect IDE extensions to provide this payload as part of the startup sequence
 * if credentials are involved.
 *
 * The structure needs to be formalized across all AWS hosts/extensions (pending design review).
 */
export type EncryptionInitialization = {
    /**
     * The version of this payload.
     * If the property is set to a value that the server has not implemented, or
     * does not support, a fatal exception is thrown.
     */
    version: string
    /**
     * Base64 encoding of the encryption key to be used for the duration of this session.
     */
    key: string
}

export function validateEncryptionDetails(encryptionDetails: EncryptionInitialization) {
    if (encryptionDetails.version !== '1.0') {
        throw new Error(`Unsupported initialization version: ${encryptionDetails.version}`)
    }

    if (!encryptionDetails.key) {
        throw new Error(`Encryption key is missing`)
    }
}
