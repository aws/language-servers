# Contributing

How to contribute.

## Pre-Requisites + Initial Setup

-   `node` version 18+
-   `npm`
-   VSCode (recommended)

Run:

```
git clone git@github.com:aws/aws-toolkit-common.git

cd aws-toolkit-common

npm install
```

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

## Running + Debugging

> **NOTE**: Ensure your VSCode workspace is `aws-toolkit-common/lsp` or else certain functionality may not work.

### With Minimal VSCode Client

This repo contains a minimal vscode client that can be used to easily run and
debug changes to this language server.

1. In the `Run & Debug` menu, run `"Launch as VSCode Extension + Debugging"`
2. Set breakpoints in `src` where needed.

### With VSCode Toolkit Extension

The VSCode Toolkit Extension can start the AWS Documents Language Server itself.
This will explain how to setup the extension to run with the language server
and be able to debug it all.

> **NOTE**: The cloned git repos must be adjacent to each other in the filesystem since commands are currently using relative paths.

1. Clone the [`aws-toolkit-vscode`](https://github.com/aws/aws-toolkit-vscode) repo:

    ```
    git clone git@github.com:aws/aws-toolkit-vscode.git

    cd aws-toolkit-vscode && \

    git fetch origin jpinkney-aws/lsp && git checkout jpinkney-aws/lsp && \

    cd ..
    ```

2. Clone the [`aws-toolkit-common`](https://github.com/aws/aws-toolkit-common) repo:

    ```console
    git clone git@github.com:aws/aws-toolkit-common.git && \

    cd aws-toolkit-common && \

    git fetch origin test-typescript-lsp && git checkout test-typescript-lsp && \

    cd ..
    ```

3. Open each project in their own VSCode window.

4. In `aws-toolkit-common` run:

    ```console
    npm run watch
    ```

5. In `aws-toolkit-vscode` start the extesion in `Run & Debug` using the `"Extension"` launch config.
   A new window will open.

6. In the new window enable the language server in the VSCode settings under `aws.experiments` and check `lsp`. This will start the language server using the output you generated in step `4`.

7. In the `aws-toolkit-common` VSCode window connect the debugger in `Run & Debug` using the `"Attach to AWS Documents Language Server"` launch config. Set breakpoints where needed.

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
