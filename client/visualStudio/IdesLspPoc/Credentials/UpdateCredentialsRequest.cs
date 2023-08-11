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
        /// Encrypted token (JWT or PASETO)
        /// The token's contents differ whether IAM or Bearer token is sent
        /// </summary>
        [JsonProperty("data")]
        public string Data;
    }
}
