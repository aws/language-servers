using Amazon.Runtime;
using Amazon.Runtime.CredentialManagement;
using IdesLspPoc.Credentials;
using IdesLspPoc.Output;
using Microsoft.VisualStudio.Threading;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using Org.BouncyCastle.Crypto.Engines;
using Org.BouncyCastle.Crypto.Modes;
using Org.BouncyCastle.Crypto.Parameters;
using Org.BouncyCastle.Security;
using StreamJsonRpc;
using System;
using System.Text;
using System.Threading.Tasks;
using System.Timers;

namespace IdesLspPoc.LspClient.S3
{
    /// <summary>
    /// This class knows how to push credentials over to the language server (via SendIamCredentialsAsync)
    /// PROOF OF CONCEPT - this class would be used in a product like the AWS Toolkit 
    /// to push credentials to the server whenever the credentials state changes (eg: user selects another profile, or
    /// credentials expire). For this concept, it is resolving and pushing credentials every 10 seconds as a 
    /// simulation of the Toolkit sending credentials to the server.
    /// This class would also know how to clear credentials from the language server.
    /// </summary>
    internal class S3CredentialsUpdater
    {
        private static readonly JsonSerializerSettings _serializerSettings = new JsonSerializerSettings
        {
            ContractResolver = new DefaultContractResolver
            {
                NamingStrategy = new CamelCaseNamingStrategy(),
            }
        };

        private Timer _resendTimer;
        private OutputWindow _outputWindow;
        private JsonRpc _rpc;
        private byte[] _aesKey;

        public S3CredentialsUpdater(JsonRpc rpc, byte[] aesKey, OutputWindow outputWindow)
        {
            this._rpc = rpc;
            _aesKey = aesKey;
            _outputWindow = outputWindow;
        }

        /// <summary>
        /// We start sending the lsp server credentials every 10 seconds as a simulation of the credentials state changing
        /// </summary>
        public void StartCredentialsRefreshSimulation()
        {
            _resendTimer?.Stop();

            _resendTimer = new Timer()
            {
                AutoReset = true,
                Interval = 10_000,
            };

            _resendTimer.Elapsed += OnRefreshCredentials;

            _resendTimer.Start();
        }

        private void OnRefreshCredentials(object sender, ElapsedEventArgs e)
        {
            // PROOF OF CONCEPT
            // We will resolve the default profile from the local system.
            // In a product, the host extension would know which profile it is configured to provide to the language server.
            var creds = new SharedCredentialsFile();
            if (!creds.TryGetProfile("default", out var profile))
            {
                _outputWindow.WriteLine("Client: Unable to get default profile");
                return;
            }

            Task.Run(async () =>
            {
                AWSCredentials awsCredentials = profile.GetAWSCredentials(creds);
                var request = CreateUpdateCredentialsRequest(await awsCredentials.GetCredentialsAsync(), _aesKey);
                await SendIamCredentialsAsync(request);
            }).Forget();
        }

        public async Task SendIamCredentialsAsync(UpdateCredentialsRequest request)
        {
            _outputWindow.WriteLine("Client: Sending (simulated) refreshed Credentials to the server");
            await this._rpc.NotifyAsync("$/aws/credentials/iam/update", request);
        }

        private static UpdateCredentialsRequest CreateUpdateCredentialsRequest(ImmutableCredentials credentials, byte[] aesKey)
        {
            var requestData = new UpdateIamCredentialsRequestData
            {
                AccessKeyId = credentials.AccessKey,
                SecretAccessKey = credentials.SecretKey,
                SessionToken = credentials.Token,
            };

            return CreateUpdateCredentialsRequest(requestData, aesKey);
        }

        /// <summary>
        /// Creates an "update credentials" request that contains encrypted data
        /// </summary>
        private static UpdateCredentialsRequest CreateUpdateCredentialsRequest(object data, byte[] aesKey)
        {
            byte[] iv = CreateInitializationVector();

            var aesEngine = new AesEngine();
            int macSize = 8 * aesEngine.GetBlockSize();

            GcmBlockCipher cipher = new GcmBlockCipher(aesEngine);
            AeadParameters parameters = new AeadParameters(new KeyParameter(aesKey), macSize, iv);
            cipher.Init(true, parameters);

            var json = JsonConvert.SerializeObject(data, _serializerSettings);

            // Encrypt json
            byte[] cipherText = new byte[cipher.GetOutputSize(json.Length)];
            int len = cipher.ProcessBytes(Encoding.UTF8.GetBytes(json), 0, json.Length, cipherText, 0);
            cipher.DoFinal(cipherText, len);

            // Get the authTag
            byte[] mac = cipher.GetMac();
            string authtag = Convert.ToBase64String(mac);
            var dataLength = cipherText.Length - mac.Length;

            return new UpdateCredentialsRequest
            {
                Iv = Convert.ToBase64String(iv),
                // Remove Mac from end of cipherText
                Data = Convert.ToBase64String(cipherText, 0, dataLength),
                AuthTag = authtag,
            };
        }

        private static byte[] CreateInitializationVector()
        {
            var iv = new byte[16];
            SecureRandom random = new SecureRandom();
            random.NextBytes(iv);
            return iv;
        }
    }
}
