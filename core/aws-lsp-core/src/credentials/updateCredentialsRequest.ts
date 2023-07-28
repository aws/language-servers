/**
 * Request that the host uses when talking to custom notifications in
 * order to send updated credentials and bearer tokens to the language server.
 *
 * See credentialsProtocolMethodNames in core\aws-lsp-core\src\credentials\credentialsProvider.ts
 * for the custom notification names.
 *
 * While there are separate notifications for sending credentials and sending bearer tokens,
 * both notifications use this request. The `data` field is different for each notification.
 */
export interface UpdateCredentialsRequest {
    /**
     * Initialization vector for encrypted data, in base64
     */
    iv: string

    /**
     * Encrypted data, in base64. The data contents will vary based on the notification used.
     * (eg: The payload is different for IAM vs Bearer token)
     */
    data: string
    /**
     * Encrypted data's authTag - used for decryption validation
     */
    authTag: string
}
