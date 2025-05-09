# Contributing Guidelines

Thank you for your interest in contributing to our project. Whether it's a bug report, new feature, correction, or additional
documentation, we greatly value feedback and contributions from our community.

Please read through this document before submitting any issues or pull requests to ensure we have all the necessary
information to effectively respond to your bug report or contribution.

## Reporting Bugs/Feature Requests

We welcome you to use the GitHub issue tracker to report bugs or suggest features.

When filing an issue, please check existing open, or recently closed, issues to make sure somebody else hasn't already
reported the issue. Please try to include as much information as you can. Details like these are incredibly useful:

-   A reproducible test case or series of steps
-   The version of our code being used
-   Any modifications you've made relevant to the bug
-   Anything unusual about your environment or deployment

## Contributing via Pull Requests

Contributions via pull requests are much appreciated. Before sending us a pull request, please ensure that:

1. You are working against the latest source on the _main_ branch.
2. You check existing open, and recently merged, pull requests to make sure someone else hasn't addressed the problem already.
3. You open an issue to discuss any significant work - we would hate for your time to be wasted.

To send us a pull request, please:

1. Fork the repository.
2. Modify the source; please focus on the specific change you are contributing. If you also reformat all the code, it will be hard for us to focus on your change.
3. Ensure local tests pass.
4. Commit to your fork using clear commit messages.
5. Send us a pull request, answering any default questions in the pull request interface.
6. Pay attention to any automated CI failures reported in the pull request, and stay involved in the conversation.

GitHub provides additional document on [forking a repository](https://help.github.com/articles/fork-a-repo/) and
[creating a pull request](https://help.github.com/articles/creating-a-pull-request/).

## Finding contributions to work on

Looking at the existing issues is a great way to find something to contribute on. As our projects, by default, use the default GitHub issue labels (enhancement/bug/duplicate/help wanted/invalid/question/wontfix), looking at any 'help wanted' issues is a great place to start.

## Code of Conduct

This project has adopted the [Amazon Open Source Code of Conduct](https://aws.github.io/code-of-conduct).
For more information see the [Code of Conduct FAQ](https://aws.github.io/code-of-conduct-faq) or contact
opensource-codeofconduct@amazon.com with any additional questions or comments.

## Licensing

See the [LICENSE](LICENSE) file for our project's licensing. We will ask you to confirm the licensing of your contribution.

## Pre-Requisites + Initial Setup

-   `node` version 18+
-   `npm`
-   VSCode (recommended)

Run:

```
git clone git@github.com:aws/language-servers.git

cd language-servers

npm install
```

## Package naming
When creating new sub-packages, take into account the following naming guidelines: 
* If package is intended for publishing and distribution on NPM JS, use `@aws/` prefix. E.g. `@aws/<name>`.
* If package is not intended to be published, use the `@amzn/` prefix. E.g. `@amzn/<name>`

## Building the Repo

```bash
npm run compile
```

Builds are typically incremental. If you need to recompile (for example when you switch branches):

```bash
npm run clean
npm run compile
```

Language servers are built into their own packages (under ./server).

A separate set of packages (under ./app) then instantiate these language servers. These packages are packaged into standalone javascript application servers, with the intention of being integrated into IDEs. Packaging is performed with Webpack. These bundles require nodejs to be installed on the system they are run on. By default, bundles are produced in `./app/**/build/*` directories can be started as node applications, for example:

```
node ./app/aws-lsp-codewhisperer-binary/aws-lsp-codewhisperer-token-binary.js --stdio
```

## Commit Message Guidelines

Commit messages merged to main branch must follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification format. This is required to ensure readable, standard format of commits history. We also rely on it to setup automation for generating change logs and making releases.

### Commit message format

The commit message should be structured as follows:

```
<type>([optional scope]): <description>

[optional body]

[optional footer(s)]
```

The header is mandatory and the scope of the header is optional. Examples:

```
docs: correct spelling of CHANGELOG
```

```
feat(amazonq): allow provided config object to extend other configs

BREAKING CHANGE: `extends` key in config file is now used for extending other config files
```

See more examples at https://www.conventionalcommits.org/en/v1.0.0/#examples.

### Types

Type can have one of the following values:

* **build**: changes to the build system
* **chore**: any housekeeping changes, which don't fall in other category
* **ci**: changes to CI script and workflows
* **docs**: changes to documentation
* **feat**: a new feature
* **fix**: a bug fix
* **style**: visual-only changes, not impacting functionality
* **refactor**: refactorings not impacting functionality, which are not features or bug fixes
* **perf**: changes that improve performance of code
* **test**: adding or fixing tests

### Scope

The scope should indicate a package, affected by the change. List of support scopes, and corresponding packages:

* **amazonq**: `./server/aws-lsp-codewhisperer`
* **chat-client**: `./chat-client`
* **identity**: `./server/aws-lsp-identity`
* **notification**: `./server/aws-lsp-notification`
* **partiql**: `./server/aws-lsp-partiql`
* **release**: do not use manually - special scope, reserved for release automation

Empty scopes are allowed, and can be used for cases when change is not related to any particular package, e.g. for `ci:` or `docs:`

### Footer

One or more footers may be provided one blank line after the body.

**Breaking Change** must start with `BREAKING CHANGE:` words, following with description of the breaking change.

### Usage of Conventional Commit Types

The commit contains the following structural elements, to communicate intent to the consumers of your library:

* **fix**: a commit of the type fix patches a bug in your codebase (this correlates with PATCH in Semantic Versioning).
* **feat**: a commit of the type feat introduces a new feature to the codebase (this correlates with MINOR in Semantic Versioning).
* **BREAKING CHANGE**: a commit that has a footer `BREAKING CHANGE:`, or appends a `!` after the type/scope, introduces a breaking API change (correlating with MAJOR in Semantic Versioning). A BREAKING CHANGE can be part of commits of any *type*.

These rules are used by our automation workflows to collect change logs, and to compute next Semantic Version of packages, impacted by commit.

Since this repository is a shared shared monorepo with many packages, be careful when introducing changes impacting several packages. Extra care should be given when using version-impacting types (especially BREAKING CHANGE).

## Running + Debugging

> **NOTE**: Ensure your VSCode workspace is the root folder or else certain functionality may not work.

### With Minimal VSCode Client

This repo contains a minimal vscode client that can be used to easily run and
debug changes to this language server.

1. Run `npm run package` in the root folder
2. Set the breakpoints you need. 
3. **Make sure that the preLaunchTask option** (for the configuration you are running in `.vscode/launch.json`) is either not set or set to `watch`, **not** `compile`.
4. In the `Run & Debug` menu, run `"Launch as VSCode Extension + Debugging"`. Make sure this is launching the server you wish to use, look at the [launch configuration](.vscode/launch.json#L202). Keep the `Attach to AWS Documents Language Server` to use the debugger.
5. When the debugging is launched, select the `Attach to AWS Documents Language Server` option from the drop down menu (close to pause/stop buttons).
6. (Optional) in the [activation file](client/vscode/src/activation.ts#L81) you can swap `--inspect` with `--inspect-brk` if you need to debug immediately when the node process starts. Read more about it on this [site](https://www.builder.io/blog/debug-nodejs#:~:text=%2D%2Dinspect%20versus%20%2D%2Dinspect%2Dbrk)

### With VSCode Toolkit Extension

The VSCode Toolkit Extension can start the AWS Documents Language Server itself.
This will explain how to setup the extension to run with the language server
and be able to debug it all.

1. Clone the [`language-servers`](https://github.com/aws/language-servers) repo:

    ```
    git clone git@github.com:aws/language-servers.git

    cd language-servers
    ```

2. Run:

    ```console
    npm install
    npm run watch
    ```

3. Start the extension in `Run & Debug` using the `"Hello World"` launch config.
   A new window will open.

### With CodeWhisperer Server in VSCode
#### With token credentials
1. In the `Run & Debug` menu, run `"CodeWhisperer Server Token"`
2. Set breakpoints in `src` where needed
3. Check the logs in `"AWS Documents Language Server"` output window.

> **NOTE**: If you see "Recommendation failure: Error: Authorization failed, bearer token is not set" errors, make sure to authenticate using `"AWS LSP - Obtain bearer token and send to LSP server"` command.

> **NOTE**: The lsp client is activated by one of the `activationEvents` defined [here](https://github.com/aws/language-servers/blob/06fd81d1e936648ef43243865039f89c7ac142a7/client/vscode/package.json#L18-L22), the lsp client then starts the LSP server.

#### With IAM credentials
1. In the `Run & Debug` menu, run `"CodeWhisperer Server IAM"`
2. Set breakpoints in `src` where needed
3. Check the logs in `"AWS Documents Language Server"` output window.

> **NOTE**: To authenticate use ['AWS LSP - Choose credentials profile, resolve, and send to LSP Server'](https://github.com/aws/language-servers/blob/694bbb85580cc79313d65ad77b224875f74280c2/client/vscode/package.json#L32-L33) command, giving as input your iam credential profile name, for more info see [here](https://github.com/aws/language-servers/blob/694bbb85580cc79313d65ad77b224875f74280c2/client/vscode/README.md?plain=1#L11).

### With Other Clients
Using other clients can also be done with the bundle created from this package.

1. Produce a local server bundle `npm run package`. The `app/` folder contains the configuration of server(s) and it's runtime(s).
2. Take note of the bundle you wish to use. For this example we will use `app/aws-lsp-codewhisperer-runtimes/out/token-standalone.js`.
3. Run the bundle using these args `node --inspect=6012 {rootPath}/app/aws-lsp-codewhisperer-runtimes/out/token-standalone.js --nolazy --stdio --pre-init-encryption --set-credentials-encryption-key` or adjust as needed. Refer to the [activation file](client/vscode/src/activation.ts). *NOTE: make sure that --inspect or --inspect-brk args are passed right after the `node` command*
4. Attach the debugger you wish to use to the node process. Example in Visual Studio [here](https://learn.microsoft.com/en-us/visualstudio/debugger/attach-to-running-processes-with-the-visual-studio-debugger?view=vs-2022#BKMK_Attach_to_a_running_process)

## Testing

### Running Tests

#### Running Tests from the Command Line

```bash
npm test
```

---

### Writing Tests

-   The modules used in testing are:

    -   `mocha`: Testing framework
    -   `chai`: For assertions
    -   `sinon`: stub/mock/spy

-   The design of the source code is written with [dependency injection](https://en.wikipedia.org/wiki/Dependency_injection)
    in mind.
    _ An object or function receives other objects or functions
    for functionality that it depends on, instead of all functionality
    existing statically in one place.
    _ This simplifies testing and influences how tests are to be written.

#### How To Use `sinon`

`sinon` is a module that allows you to create spies, stubs and mocks.
These are the core components that complement the testing of a dependency injection designed project.

The following is a quick summary of how to use `sinon` in this project.

**Summary:**

```typescript
// Use to stub interfaces (must explicitly set type in declaration)
stubInterface()

stub(new MyClass()) // Use to stub objects

stub(myFunc) // Use to stub functions

// Explicitly typing
let myClassStub: SinonStubbedInstance<MyClass>
// vs
let myClassStub: MyClass
// will have an impact on compilation and method completion
```

**Imports:**

```typescript
import { stubInterface } from 'ts-sinon' // Only use this module for `stubInterface`
import { SinonStubbedInstance, SinonStubbedMember, createStubInstance, stub } from 'sinon'
```

**Object Instance Stub:**

```typescript
let myClassStub: SinonStubbedInstance<MyClass> = stub(new MyClass())
// Do this if you want myFunc() to execute its actual functionality
myClassStub.myFunc.callThrough()

// Or if you plan to only explicitly stub return values
// it is safer/easier to do the following.
// Note we are not creating a new instance of MyClass here.
let myClassStub: SinonStubbedInstance<MyClass> = createStubInstance(MyClass)
myClassStub.myFunc.returns(3)
```

**Interface Stub:**

```typescript
// Note the need for `ts-sinon.stubInterface()` to stub interfaces.
// `sinon` does not provide the ability to stub interfaces.
let myInterfaceStub: SinonStubbedInstance<MyInterface> = stubInterface()

myInterfaceStub.someFunctionItDefined.returns('my value')
```

**Function Stub:**

```typescript
interface myFuncInterface {
    (x: string): string
}
myFunc: myFuncInterface = (x: string) => {
    return x
}

// Note `SinonStubedMember` instead of `SinonStubbedInstance` for functions
const myFuncStub: SinonStubbedMember<myFuncI> = stub(myFunc)

// Must explicitly type with `SinonStubbedMember` on assignment for this to pass linting
myFuncStub.callThrough()
```

**Resetting `callThrough()`:**

If you use `callThrough()` on a stubbed object and then want to have it return
a custom value with `returns()`. You must first call `resetBehaviour()`, then `returns()` will work.

```typescript
const myStubbedFunc = stub()
myStubbedFunc.callThrough()
myStubbedFunc.resetBehaviour()
myStubbedFunc.returns()
```

---

## Troubleshooting

### Viewing Logs in VSCode

-   Change the setting `awsDocuments.trace.server` to `"verbose"`. This shows all communication between the client and server.
-   In the top left menu bar: `View > Output`
-   Select `"AWS Documents Language Server"` from the dropdown menu in the topright.

### Amazon Q Chat window is not visible in sample VS Code extension

Sample Q Chat extension window may not open at startup of this Sample extension or not in focus on extension startup.

1. Check if `ENABLE_CHAT` flag is set to `true` in `.vscode/launch.json`.
2. Manually focus on Chat window by running `Focus on Amazon Q Chat View` VS Code command.

## Developer Notes

### Develop and test Language servers with Language Server Runtimes locally

Language servers developed in this package can be built for different runtimes developed in [Language Server Runtimes](https://github.com/aws/language-server-runtimes) project.

`Language Server Runtimes` provides a set of interfaces and constructs that can be used to inject cross-platform implementations of features, reused across language servers. Using runtime constructs, Language Servers could be built and packages into artifact of different formats: standalone bundle formats as explained earlier in this document, or packages as Javascript Webworker bundle.

This Language Servers repository includes set of packages, which demonstrate how to build Language server together with specific runtime. See [Building the Repo](#building-the-repo) section in this guide.

#### Developing both Language Servers and Runtimes projects

Sometimes there is a need to build and develop both Language Servers with Language Server Runtimes projects. Since [`language-server-runtimes`](https://github.com/aws/language-server-runtimes) is used as an npm dependency, it can be developed using `npm link` in this repo.

1. Clone the [`language-servers`](https://github.com/aws/language-servers) and the [`language-server-runtimes`](https://github.com/aws/language-server-runtimes) repos:

    ```bash
    git clone git@github.com:aws/language-servers.git
    git clone git@github.com:aws/language-server-runtimes.git
    ```

2. Install dependencies in `language-server-runtimes` folder. Create `npm link` for it, if you plan to modify it for development and testing purposes.

**Note**: Since v0.2.3, we need to create a link to `/language-server-runtimes/runtimes/out` directory, due to monorepo structure of `language-server-runtimes` project.

    ```bash
    cd language-server-runtimes && npm install && cd ./runtimes && npm run prepub && cd ./out && npm link
    ```

3. Install dependencies in `language-servers` folder:

    ```bash
    cd ../language-servers && npm install
    ```

4. Use npm link to `language-server-runtimes`:

    ```bash
    npm link @aws/language-server-runtimes
    ```

5. Build server bundles:

    ```bash
    npm run package
    ```

Using local checkout of `language-server-runtimes` you can iterate or experiment with both projects and produce working language server builds locally. Built servers can be found in `./app/**/build` folder.

**Doesn’t seem like language-servers is using your local language-server-runtimes install?**  Try the extreme option:
```
# From language-server-runtimes
npm run clean &&
npm install &&
npm -ws install &&
npm run compile &&
npm -ws run prepub --if-present

# From language-servers
npm run clean &&
rm -fr node_modules &&
rm -fr server/aws-lsp-codewhisperer/node_modules
npm install &&
npm -ws install &&
npm link @aws/language-server-runtimes @aws/language-server-runtimes-types &&
npm run compile -- --force
```

### Customization
#### Single Profile Customizations
To request customization information for a selected developer profile, use the `aws/getConfigurationFromServer` LSP extension with the section field set to `aws.q.customizations`.

#### Multiple Profile Customizations
To request customization information for all valid developer profiles, use the same `aws/getConfigurationFromServer` LSP extension. However, this requires setting the following initialization parameters in the client: 
1. `initializationOptions.aws.awsClientCapabilities.q.customizationsWithMetadata`
2. `initializationOptions.aws.awsClientCapabilities.q.developerProfiles`

Both the above-mentioned fields must be set to true.

#### Testing Customizations
When testing customizations with the minimal VSCode extension, set the `ENABLE_CUSTOMIZATIONS_WITH_METADATA` environment variable to `true` in your launch configuration.

### Endpoint and region override
It is possible to override the default region and default endpoint utilized by the AWS SDK clients (e.g. for the Q developer backend api endpoint) when building the capabilities servers.

In order to set such variables and override the default values, it is sufficient to add the `AWS_Q_REGION` and `AWS_Q_ENDPOINT_URL` environment variables respectively to the [launch configuration](https://github.com/aws/language-servers/blob/34dd2f6598bc9b17014ae6f0d2ffbcf8297cfd80/.vscode/launch.json#L84).

**Example:**
```
{
            "name": "CodeWhisperer Server Token",
            "type": "extensionHost",
            "request": "launch",
            "runtimeExecutable": "${execPath}",
            "args": ["--extensionDevelopmentPath=${workspaceFolder}/client/vscode", "--disable-extensions"],
            "outFiles": ["${workspaceFolder}/client/vscode/out/**/*.js"],
            "env": {
                "LSP_SERVER": "${workspaceFolder}/app/aws-lsp-codewhisperer-runtimes/out/token-standalone.js",
                "ENABLE_INLINE_COMPLETION": "true",
                "ENABLE_TOKEN_PROVIDER": "true",
                "ENABLE_CUSTOM_COMMANDS": "true",
                "ENABLE_CHAT": "true",
                "ENABLE_CUSTOMIZATIONS": "true",
                "AWS_Q_REGION": "set_region_here",
                "AWS_Q_ENDPOINT_URL" : "set_q_endpoint_here"
            },
            "preLaunchTask": "compile"
        }
```
As visible [here](https://github.com/aws/language-servers/blob/34dd2f6598bc9b17014ae6f0d2ffbcf8297cfd80/server/aws-lsp-codewhisperer/src/constants.ts), the default values for such variables is:
```
export const DEFAULT_AWS_Q_ENDPOINT_URL = 'https://codewhisperer.us-east-1.amazonaws.com/'
export const DEFAULT_AWS_Q_REGION = 'us-east-1'
```

### Important Note About Bundling

When integrating and bundling the language servers into your own project, we provide examples of bundling configurations with webpack (see `language-servers/app` folder for different bundling config examples e.g. `aws-lsp-codewhisperer-runtimes` for the `server/aws-lsp-codewhisperer` language server). In case you are working with a different bundler (e.g. vite) we recommend using webpack pre-bundled server artifacts rather than attempting to bundle the server code with alternative bundlers.

While it's possible to use other bundlers (like Vite, Rollup, etc.), we've encountered various compatibility issues when attempting direct bundling with these tools, for instance previous attempts with Vite resulted in significant challenges that were difficult to resolve.

**Recommended Approach:**
1. Use the Webpack configuration provided in this repository as a starting point to pre-bundle the language server with webpack
2. Import and use the pre-bundled server artifact in your project, regardless of which bundler your project uses

This approach ensures maximum compatibility and helps avoid common integration issues. While we don't provide out-of-the-box configurations for other bundlers, we might be able to assist with Webpack configuration for pre-bundling if needed. If you encounter webpack bundling-related issues, please open a GitHub issue for support.
