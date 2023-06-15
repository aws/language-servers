using Microsoft.VisualStudio;
using Microsoft.VisualStudio.Shell;
using Microsoft.VisualStudio.Shell.Interop;
using System;
using System.ComponentModel.Composition;
using System.Threading;
using System.Threading.Tasks;

namespace IdesLspPoc.Output
{
    /// <summary>
    /// This is a small Output window wrapper for use in the prototype extension
    /// </summary>
    [Export(typeof(OutputWindow))]
    [PartCreationPolicy(CreationPolicy.Shared)]
    public class OutputWindow
    {
        private bool _initialized = false;

        private IVsOutputWindow _outputWindowManager;
        private IVsOutputWindowPane _outputWindowPane;

        private Guid _windowPaneId = Guid.NewGuid();
        private readonly string _name = "AWS Language Support";

        public async Task InitializeAsync(CancellationToken token)
        {
            if (_initialized) { return; }

            await ThreadHelper.JoinableTaskFactory.SwitchToMainThreadAsync();

            _outputWindowManager = Package.GetGlobalService(typeof(IVsOutputWindow)) as IVsOutputWindow;

            if (_outputWindowManager.CreatePane(
                    ref _windowPaneId,
                    _name,
                    Convert.ToInt32(true),
                    Convert.ToInt32(false)) != VSConstants.S_OK)
            {
                return;
            }

            _outputWindowManager.GetPane(ref _windowPaneId, out _outputWindowPane);
            _outputWindowPane.Activate();

            _initialized = true;
        }

        public void WriteLine(string message)
        {
            ThrowIfUninitialized();
            _outputWindowPane.OutputStringThreadSafe(message + Environment.NewLine);
        }

        private void ThrowIfUninitialized()
        {
            if (!_initialized)
            {
                throw new InvalidOperationException("Output window is not initialized");
            }
        }
    }
}