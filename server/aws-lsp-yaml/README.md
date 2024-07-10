## Exports

    ── CreateYamlLanguageServer - a function that creates and returns a new instance of DEXP Language Server
    ── YamlLanguageService - YAML language service. Provides language features like hover, completion, diagnostics and formatting

## Temporary Patch for yaml-language-server Dependency

In the current state of this package, we need to apply a temporary patch to the yaml-language-server dependency.

The script applies 2 patches:
- `patches/markdown`: adds hover setting to enable/disable Title and Source from hover tooltip. [PR](https://github.com/redhat-developer/yaml-language-server/pull/892)
- `patches/unsafe-eval`: adds skipSchemaValidation settings to enable/disable json schema validation. [PR draft](https://github.com/redhat-developer/yaml-language-server/pull/965).


The patch file is applied during the installation process using the `postinstall` script in the `package.json` file. This script runs the `patchYamlPackage.js` script, which searches path to the `yaml-language-server` package and applies the patches once.

### Note: This is a temporary solution, and we plan to remove the custom patching once the yaml-language-server package is updated. The features from PRs above should be merged to yaml-language-server package. After features are merged we need to update the version and enable skipSchemaValidation setting.
