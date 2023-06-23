using Microsoft.VisualStudio.LanguageServer.Client;
using Microsoft.VisualStudio.Shell;
using Microsoft.VisualStudio.Threading;
using System;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using OutputWindow = IdesLspPoc.Output.OutputWindow;
using Process = System.Diagnostics.Process;

namespace IdesLspPoc.LspClient
{
    // NOTE : We use the SDK and will need to split code/references across major VS versions

    // Design thoughts - one of these for each distinct LSP we manage. We could have multiple ContentType declarations.

    public abstract class ToolkitLspClient : ILanguageClient
    {
        [Import]
        protected OutputWindow _outputWindow;

        public event AsyncEventHandler<EventArgs> StartAsync;
        public event AsyncEventHandler<EventArgs> StopAsync;

        /// <summary>
        /// Name of Language Client; displayed to user
        /// For example, if the LSP writes logs to an output window, this is where they will appear
        /// </summary>
        public abstract string Name { get; }

        /// <summary>
        /// Used if we set up a JSON that drives some behavior through settings
        /// https://learn.microsoft.com/en-us/visualstudio/extensibility/adding-an-lsp-extension?view=vs-2022#settings
        /// </summary>
        public IEnumerable<string> ConfigurationSections
        {
            get
            {
                // see IdesLspPoc\LspClientSettings.json for configuration values (like enabling tracing)
                // see lsp.pkgdef for bundling the config into the extension
                yield return "ideslsp";
            }
        }

        /// <summary>
        /// Payload sent to LSP server in the "initialize" message
        /// https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#initialize
        /// </summary>
        /// <inheritdoc cref="ILanguageClient.InitializationOptions"/>
        public object InitializationOptions { get; } = null;

        public IEnumerable<string> FilesToWatch { get; } = new List<string>()
        {
            // "**/*.buildspec",
            // "**/*buildspec*.yml",
            // "**/*buildspec*.yaml",
            // "**/buildspec/**/*.yml",
            // "**/buildspec/**/*.yaml",
            // "build.yml",
            // "**/*build.yml",
            // "**/*build.yaml",
        };

        public bool ShowNotificationOnInitializeFailed { get; } = true;

        // Just exploring how to query for VS what file types it knows about
        // [Import]
        // internal IContentTypeRegistryService ContentTypeRegistryService { get; set; }

        /// <summary>
        /// VS Calls this when the extension has loaded
        /// </summary>
        /// <inheritdoc cref="ILanguageClient.OnLoadedAsync"/>
        public async Task OnLoadedAsync()
        {
            // Just exploring how to query for VS what file types it knows about
            // var x = ContentTypeRegistryService.ContentTypes.ToList();
            // var ttt = x.Select(q => q.DisplayName).ToList();

            // Design thoughts - we might start downloading the LSP in the background here.
            // We would conclude then call StartAsync when the download completes, in order to trigger ActivateAsync.

            await _outputWindow.InitializeAsync(CancellationToken.None);
            
            await StartAsync.InvokeAsync(this, EventArgs.Empty);
        }

        /// <summary>
        /// VS Calls this to start up the Language Server and get the communications streams
        /// </summary>
        /// <inheritdoc cref="ILanguageClient.ActivateAsync"/>
        public async Task<Connection> ActivateAsync(CancellationToken token)
        {
            await Task.Yield();

            _outputWindow.WriteLine("Launching Language Server");

            await TaskScheduler.Default;

            var lspProcess = CreateLspProcess();

            if (!lspProcess.Start())
            {
                // null indicates the server cannot be started
                return null;
            }

            return new Connection(lspProcess.StandardOutput.BaseStream, lspProcess.StandardInput.BaseStream);
        }

        /// <summary>
        /// VS calls this after successfully making initialization calls with the language server
        /// </summary>
        /// <inheritdoc cref="ILanguageClient.OnServerInitializedAsync"/>
        public Task OnServerInitializedAsync()
        {
            _outputWindow.WriteLine("Language Server is initialized");
            return Task.CompletedTask;
        }

        /// <summary>
        /// VS calls this if it was not successful in making initialization calls with the language server
        /// </summary>
        /// <inheritdoc cref="ILanguageClient.OnServerInitializeFailedAsync"/>
        public Task<InitializationFailureContext> OnServerInitializeFailedAsync(ILanguageClientInitializationInfo initializationState)
        {
            // Design notes - perform any cleanup work (if any) here
            _outputWindow.WriteLine("Language Server failed: ");
            _outputWindow.WriteLine($"- Status Message: {initializationState.StatusMessage}");
            _outputWindow.WriteLine($"- Exception: {initializationState.InitializationException?.Message}");
            _outputWindow.WriteLine($"- Initialized: {initializationState.IsInitialized}");
            _outputWindow.WriteLine($"- Status: {initializationState.Status}");

            var failureInfo = new InitializationFailureContext()
            {
                FailureMessage = initializationState.StatusMessage ??
                                 $"Unknown initialization failure, exception: {initializationState.InitializationException?.Message}",
            };

            return Task.FromResult(failureInfo);
        }

        private Process CreateLspProcess()
        {
            ProcessStartInfo info = new ProcessStartInfo
            {
                WorkingDirectory = GetServerWorkingDir(),
                FileName = GetServerPath(),
                Arguments = "--stdio",
                RedirectStandardInput = true,
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };

            Process process = new Process
            {
                StartInfo = info,
            };

            return process;
        }

        protected abstract string GetServerWorkingDir();

        protected abstract string GetServerPath();
    }
}