using IdesLspPoc.ContentDefinitions;
using Microsoft.VisualStudio.LanguageServer.Client;
using Microsoft.VisualStudio.Utilities;
using System.ComponentModel.Composition;

namespace IdesLspPoc.LspClient
{
    // NOTE : We use the SDK and will need to split code/references across major VS versions

    // Design thoughts - one of these for each distinct LSP we manage. We could have multiple ContentType declarations.

    // this one "just works" to associate this LSP with yaml files
    [ContentType("yaml")]

    // for some reason, we have associate LSPs with JSON using a custom type - see JsonContentType for comments
    [ContentType(JsonContentType.ContentTypeName)]

    // [ContentType(BuildSpec.ContentType)] // Only add this if you're supporting custom file extensions
    [Export(typeof(ILanguageClient))]
    public class CloudFormationLspClient : ToolkitLspClient
    {
        /// <summary>
        /// Name of Language Client; displayed to user
        /// For example, if the LSP writes logs to an output window, this is where they will appear
        /// </summary>
        public override string Name => "AWS Toolkit language client for CloudFormation Templates";

        protected override string GetServerWorkingDir()
        {
            // to try using this extension, update dir to wherever your lsp service executable is
            return @"C:\code\aws-toolkit-common\lsp\app\aws-lsp-cloudformation-binary\bin";
        }

        protected override string GetServerPath()
        {
            return $@"{GetServerWorkingDir()}\aws-lsp-cloudformation-binary-win.exe";
        }
    }
}