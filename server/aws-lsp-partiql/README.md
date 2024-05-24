# PartiQL LSP server

LSP server for the [PartiQL language](https://partiql.org/). This server offers diagnostics for PartiQL files by parsing the file using the [Rust parser maintained by the PartiQL team](https://github.com/partiql/partiql-lang-rust).

This parser is compiled to a WebAssembly binary using the bindings maintained by the PartiQL team in the [PartiQL playground package](https://github.com/partiql/partiql-rust-playground). This binary is further encoded as a base64 string in a Javascript file to make it easy to be bundled together with the other assets of the server.

### Updating the binary

_Updating the binary requires the Docker CLI to be in your PATH_

To update the binary used by the server, run `npm run update-parser-binary`. This will, inside a Docker container, pull the PartiQL playground repository from GitHub and run the `build` command to create a new binary. It is then encoded into base64 in a Typescript file and copied to the `src` folder. Running `npm run build` will then transpile the binary file to Javascript and place it in the `lib` folder.

### Tests

Tests for this package are run using [Jest](https://jestjs.io/), to run the tests in this package run `-npm run test`. 

### Potential improvements

This package currently has a couple of potential points-of-improvement:

- In the bindings for the parser WASM binary, there is a code path which imports the `partiql_playground_bg.wasm` file. We don't use this file and code path at runtime due to the inlining of the WASM binary. When doing import checks however, Webpack fails building because it cannot find this binary. To work around this, we include a no-op file with the expected name.
- In the tests for the language service, there are a couple of untested happy paths. Input couldn't be found to trigger these happy paths.