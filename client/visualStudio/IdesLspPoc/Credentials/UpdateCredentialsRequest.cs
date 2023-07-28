using Newtonsoft.Json;

namespace IdesLspPoc.Credentials
{
    /// <summary>
    // Request that the host uses when talking to custom notifications in
    // order to send updated credentials and bearer tokens to the language server.
    // 
    // See credentialsProtocolMethodNames in core\aws-lsp-core\src\credentials\credentialsProvider.ts
    // for the custom notification names.
    // 
    // While there are separate notifications for sending credentials and sending bearer tokens,
    // both notifications use this request.The `data` field is different for each notification.
    /// </summary>
    public class UpdateCredentialsRequest
    {
        /// <summary>
        /// Initialization vector for encrypted data, in base64
        /// </summary>
        [JsonProperty("iv")]
        public string Iv;

        /// <summary>
        /// Encrypted data, in base64. The data contents will vary based on the request made.
        /// (eg: The payload is different when requesting IAM vs Bearer token)
        /// </summary>
        [JsonProperty("data")]
        public string Data;

        /// <summary>
        /// Encrypted data's authTag - used for decryption validation
        /// </summary>
        [JsonProperty("authTag")]
        public string AuthTag;
    }
}
