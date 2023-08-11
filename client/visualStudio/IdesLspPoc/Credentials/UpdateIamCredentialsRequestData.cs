using Newtonsoft.Json;

namespace IdesLspPoc.Credentials
{
    public class UpdateIamCredentialsRequestData
    {
        [JsonProperty("accessKeyId")]
        public string AccessKeyId;

        [JsonProperty("secretAccessKey")]
        public string SecretAccessKey;

        [JsonProperty("sessionToken")]
        public string SessionToken;
    }
}