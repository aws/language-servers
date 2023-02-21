using Microsoft.VisualStudio.LanguageServer.Client;
using Microsoft.VisualStudio.Utilities;
using System.ComponentModel.Composition;

namespace IdesLspPoc.ContentDefinitions
{
    // Design notes:
    // We only need to declare a content type if we are going to support a custom file extension. It would look like this.
    // You'd then add this attribute to the LSP client: [ContentType(BuildSpec.ContentType)]
    public static class BuildSpec
    {
        public const string ContentType = "awsBuildSpec";

        /// <summary>
        /// MEF Declarations that Visual Studio uses to bring together the Language client
        /// </summary>

#pragma warning disable 0649 // (Never assigned to)
        [Export]
        [Name(ContentType)]
        [BaseDefinition(CodeRemoteContentDefinition.CodeRemoteContentTypeName)]
        internal static ContentTypeDefinition BuildSpecContentTypeDefinition;

        [Export]
        [FileExtension(".buildspec")]
        [ContentType(ContentType)]
        internal static FileExtensionToContentTypeDefinition BuildSpecFileExtensionDefinition;

        // Design notes
        // - we can NOT declare a content type that uses file extensions already supported by Visual Studio (eg ".yaml")
        // - these are ignored by Visual Studio, and our language client will not be loaded or applied to those files

        // [Export]
        // [FileExtension(".yml")]
        // [ContentType(ContentType)]
        // internal static FileExtensionToContentTypeDefinition YmlFileExtensionDefinition;
        //
        // [Export]
        // [FileExtension(".yaml")]
        // [ContentType(ContentType)]
        // internal static FileExtensionToContentTypeDefinition YamlFileExtensionDefinition;
#pragma warning restore 0649
    }
}