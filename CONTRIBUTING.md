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

A separate set of packages (under ./app) then instantiate these language servers. These packages are packaged into standalone binary applications, with the intention of being integrated into IDEs. Packaging is performed using [vercel/pkg](https://github.com/vercel/pkg), which bundles both the project and nodejs into a binary. These binaries don't require nodejs to be installed on the system they are run on.

For details on how to configure bundling with pkg, see [pkg usage](https://github.com/vercel/pkg#usage).

### pkg Examples

If you want to create windows-x64, macos-x64, linux-x64 binaries you can use:

```bash
pkg .
```

if you have a different node version installed (eg: node19) from your target package (eg: node18) you can do:

```bash
pkg --targets node18 .
```

to create a standalone executable for node16 for windows on arm you can do

```bash
pkg --targets node16-windows-arm64 .
```

to ensure the standalone language server is compressed even more you can do:

```bash
pkg --compress GZip .
```
### AWS SDK generator

When the AWS SDK does not (yet) support a service but you have an API
model file (`*.api.json`), use `generateServiceClient.ts` to generate
a TypeScript `*.d.ts` file and pass that to the AWS JS SDK to create
requests just from the model/types.

1. Add an entry to the list in `generateServiceClient.ts`:
    ```diff
     diff --git a/src/scripts/build/generateServiceClient.ts b/src/scripts/build/generateServiceClient.ts
     index 8bb278972d29..6c6914ec8812 100644
     --- a/src/scripts/build/generateServiceClient.ts
     +++ b/src/scripts/build/generateServiceClient.ts
     @@ -199,6 +199,10 @@ ${fileContents}
      ;(async () => {
          const serviceClientDefinitions: ServiceClientDefinition[] = [
     +        {
     +            serviceJsonPath: 'src/shared/foo.api.json',
     +            serviceName: 'ClientFoo'
     +        },
              {
                  serviceJsonPath: 'src/shared/telemetry/service-2.json',
                  serviceName: 'ClientTelemetry',
    ```
2. Run the script:
    ```
    npm run generateClients
    ```
3. The script produces a `*.d.ts` file (used only for IDE
   code-completion, not required to actually make requests):
    ```
    src/shared/foo.d.ts
    ```
4. To make requests with the SDK, pass the `*.api.json` service model to
   `globals.sdkClientBuilder.createAndConfigureServiceClient` as a generic
   `Service` with `apiConfig=require('foo.api.json')`.

    ```ts
    // Import the `*.d.ts` file for code-completion convenience.
    import * as ClientFoo from '../shared/clientfoo'
    // The AWS JS SDK uses this to dynamically build service requests.
    import apiConfig = require('../shared/foo.api.json')

    ...

    const c = await globals.sdkClientBuilder.createAwsService(
        opts => new Service(opts),
        {
            apiConfig: apiConfig,
            region: 'us-west-2',
            credentials: credentials,
            correctClockSkew: true,
            endpoint: 'foo-beta.aws.dev',
        }) as ClientFoo
    const req = c.getThing({ id: 'asdf' })
    req.send(function (err, data) { ... });
    ```

## Running + Debugging

> **NOTE**: Ensure your VSCode workspace is the root folder or else certain functionality may not work.

### With Minimal VSCode Client

This repo contains a minimal vscode client that can be used to easily run and
debug changes to this language server.

1. In the `Run & Debug` menu, run `"Launch as VSCode Extension + Debugging"`
2. Set breakpoints in `src` where needed.

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

1. In the `Run & Debug` menu, run `"CodeWhisperer Server"`
2. Set breakpoints in `src` where needed
3. Check the logs in `"AWS Documents Language Server"` output window.

> **NOTE**: If you see "Recommendation failure: Error: Authorization failed, bearer token is not set" errors, make sure to authenticate using `"AWS LSP - Obtain bearer token and send to LSP server"` command.

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

## Developer Notes

### Develop and test Language servers with Language Server Runtimes locally

Language servers developed in this package can be built for different runtimes developed in [Language Server Runtimes](https://github.com/aws/language-server-runtimes) project.

`Language Server Runtimes` provides a set of interfaces and constructs that can be used to inject cross-platform implementations of features, reused across language servers. Using runtime constructs, Language Servers could be built and packages into artifact of different formats: binary formats as explained earlier in this document, or packages as Javascript Webworker bundle.

To build and test Language Servers with AWS Runtime, follow these steps:

1. Clone the [`language-servers`](https://github.com/aws/language-servers) and the [`language-server-runtimes`](https://github.com/aws/language-server-runtimes) repos:

    ```
    git clone git@github.com:aws/language-servers.git
    git clone git@github.com:aws/language-server-runtimes.git
    ```

2. Install dependencies in `language-server-runtimes` folder. Create `npm link` for it, if you plan to modify it for development and testing purposes:

    ```
    cd language-server-runtimes && npm install && npm run compile && npm link
    ```

3. Install dependencies in `language-servers` folder:

    **Note:** We are temporarily commiting a snapshot of `language-server-runtimes` package as zip archive and use it as npm dependency for some servers. To develop and build language servers with local checkout of `language-server-runtimes`, for servers develped in ./server directory change `"@aws/language-server-runtimes"` dependency to point to `"*"` instead of file path before running `npm install`.

    ```
    cd ../language-servers && npm install
    ```

4. (Optional) Use npm link to `language-server-runtimes`, if you're developing locally and want to use local copy to produce build artifacts:

    ```
    npm link @aws/language-server-runtimes
    ```

5. Build server binaries:

    ```
    npm run package
    ```

Using local checkout of `language-server-runtimes` you can iterate or experiment with both projects and produce working language server builds locally. Built servers can be found in `./app/*/bin` folder.
