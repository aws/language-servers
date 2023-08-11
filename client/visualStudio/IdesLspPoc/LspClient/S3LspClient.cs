using IdesLspPoc.ContentDefinitions;
using IdesLspPoc.LspClient.S3;
using Microsoft.VisualStudio.LanguageServer.Client;
using Microsoft.VisualStudio.Utilities;
using Newtonsoft.Json;
using StreamJsonRpc;
using System;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Threading.Tasks;

namespace IdesLspPoc.LspClient
{
    /// <summary>
    /// This is a sample integration that provides S3 bucket names as completion text for
    /// files named "*.s3.json".
    /// </summary>

    // for some reason, we have associate LSPs with JSON using a custom type - see JsonContentType for comments
    [ContentType(JsonContentType.ContentTypeName)]

    [Export(typeof(ILanguageClient))]
    public class S3LspClient : ToolkitLspClient, ILanguageClientCustomMessage2
    {
        /// <summary>
        /// Name of Language Client; displayed to user
        /// For example, if the LSP writes logs to an output window, this is where they will appear
        /// </summary>
        public override string Name => "AWS Toolkit language client for Amazon S3";

        public override object InitializationOptions
        {
            get
            {
                // This is how we configure the behavior of AWS Language Servers.
                // The structure needs to be formalized across all AWS hosts/extensions.
                //
                // This structure is exploration/conceptual/speculative at this time.
                // See lsp\core\aws-lsp-core\src\initialization\awsInitializationOptions.ts
                return new
                {
                    // CONCEPT: We signal that we can provide credentials.
                    credentials = new
                    {
                        providesIam = true,
                    }
                };
            }
        }

        private readonly byte[] _aesKey = new byte[32];
        private S3CredentialsUpdater _credentialsUpdater;

        public S3LspClient()
        {
            // Create encryption key for this session
            using (var aes = Aes.Create())
            {
                aes.KeySize = 32 * 8;
                aes.GenerateKey();

                Array.Copy(aes.Key, _aesKey, _aesKey.Length);
            }
        }

        protected override string GetServerWorkingDir()
        {
            // to try using this extension, update dir to wherever your lsp service executable is
            return @"C:\code\aws-toolkit-common\lsp\app\aws-lsp-s3-binary\bin";
        }

        protected override string GetServerPath()
        {
            return $@"{GetServerWorkingDir()}\aws-lsp-s3-binary-win.exe";
        }

        protected override IEnumerable<string> GetLspProcessArgs()
        {
            return base.GetLspProcessArgs()
                .Concat(new[] {
                    // Signal that we will send the encryption key before starting the LSP protocol channel
                    "--pre-init-encryption"
                });
        }

        protected override async Task OnBeforeLspConnectionStartsAsync(Process lspProcess)
        {
            WriteEncryptionInit(lspProcess.StandardInput);

            await base.OnBeforeLspConnectionStartsAsync(lspProcess);
        }

        private void WriteEncryptionInit(StreamWriter writer)
        {
            var json = JsonConvert.SerializeObject(new
            {
                version = "1.0",
                mode = "JWT",
                key = Convert.ToBase64String(_aesKey),
            });

            writer.WriteLine(json);
        }

        #region ILanguageClientCustomMessage2

        private JsonRpc _rpc;
        public object MiddleLayer => null;

        /// <summary>
        /// Allows extensions to handle LSP messages
        /// Must be set before starting the language server (occurs in the base class OnLoadedAsync)
        /// https://learn.microsoft.com/en-us/dotnet/api/microsoft.visualstudio.languageserver.client.ilanguageclientcustommessage2.custommessagetarget?view=visualstudiosdk-2022#microsoft-visualstudio-languageserver-client-ilanguageclientcustommessage2-custommessagetarget
        /// </summary>
        public object CustomMessageTarget { get; private set; }

        public Task AttachForCustomMessageAsync(JsonRpc rpc)
        {
            _rpc = rpc;

            // This is how we would call custom notifications to push credentials to the server
            _credentialsUpdater = new S3CredentialsUpdater(_rpc, _aesKey, _outputWindow);
            _credentialsUpdater.StartCredentialsRefreshSimulation();

            return Task.CompletedTask;
        }

        #endregion
    }
}