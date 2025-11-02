# Language Servers Monorepo Structure

## Overview

This monorepo contains AWS Language Servers, chat clients, and the Mynah UI component library organized as npm workspaces for efficient development and deployment.

## Directory Structure

```
language-servers/
├── app/                         # Language Server Runtime Applications
│   ├── aws-lsp-antlr4-runtimes/
│   ├── aws-lsp-buildspec-runtimes/
│   ├── aws-lsp-cloudformation-runtimes/
│   ├── aws-lsp-codewhisperer-runtimes/
│   ├── aws-lsp-identity-runtimes/
│   ├── aws-lsp-json-runtimes/
│   ├── aws-lsp-notification-runtimes/
│   ├── aws-lsp-partiql-runtimes/
│   ├── aws-lsp-s3-runtimes/
│   ├── aws-lsp-yaml-runtimes/
│   ├── aws-lsp-yaml-json-webworker/
│   └── hello-world-lsp-runtimes/
│
├── server/                      # Language Server Implementations
│   ├── aws-lsp-antlr4/
│   ├── aws-lsp-buildspec/
│   ├── aws-lsp-cloudformation/
│   ├── aws-lsp-codewhisperer/
│   ├── aws-lsp-identity/
│   ├── aws-lsp-json/
│   ├── aws-lsp-notification/
│   ├── aws-lsp-partiql/
│   ├── aws-lsp-s3/
│   ├── aws-lsp-yaml/
│   ├── device-sso-auth-lsp/
│   └── hello-world-lsp/
│
├── core/                        # Core Libraries
│   ├── aws-lsp-core/
│   ├── codewhisperer/
│   ├── codewhisperer-runtime/
│   ├── codewhisperer-streaming/
│   └── q-developer-streaming-client/
│
├── chat-client/                 # Chat Client Implementation
│   ├── src/
│   │   ├── client/              # Client logic
│   │   ├── contracts/           # Type definitions
│   │   └── test/                # Tests
│   └── package.json             # Depends on mynah-ui
│
├── mynah-ui/                    # UI Component Library (Workspace Package)
│   ├── src/                     # Source code
│   │   ├── components/          # UI components
│   │   ├── helper/              # Utilities
│   │   └── styles/              # SCSS styles
│   ├── dist/                    # Build output
│   │   ├── main.js              # Bundled UI
│   │   └── manifest.json        # Flare manifest
│   ├── example/                 # Development examples
│   ├── ui-tests/                # E2E tests
│   └── docs/                    # Architecture docs
│
├── client/                      # IDE Client Implementations
│   ├── vscode/                  # VS Code client
│   ├── jetbrains/               # JetBrains client
│   └── visualStudio/            # Visual Studio client
│
├── integration-tests/           # Integration Tests
│   └── q-agentic-chat-server/
│
├── script/                      # Build & Utility Scripts
│   ├── clean.ts
│   ├── generate-flare-manifest.ts
│   ├── generate-agentic-attribution.sh
│   └── prepare-agentic-attribution-dependencies.ts
│
├── docs/                        # Documentation
│   ├── mynah-ui-integration.md  # Mynah UI integration guide
│   ├── monorepo-structure.md    # This file
│   └── images/
│
├── tests/                       # Test Configurations
├── attribution/                 # License attribution
├── binaries/                    # Binary artifacts
├── package.json                 # Root package with workspaces
└── tsconfig.json                # TypeScript configuration
```

## Workspace Configuration

Defined in root `package.json`:

```json
{
  "workspaces": [
    "app/*",
    "client/**",
    "chat-client",
    "core/*",
    "server/*",
    "server/**",
    "integration-tests/*",
    "mynah-ui"
  ]
}
```

## Package Categories

### Language Server Runtimes (app/)
Bundled applications that run language servers in various environments (web workers, Node.js, etc.)

### Language Servers (server/)
Core language server implementations providing IDE features:
- Code completion
- Diagnostics
- Hover information
- Code actions
- Formatting

### Core Libraries (core/)
Shared libraries and SDKs:
- aws-lsp-core: Common LSP utilities
- CodeWhisperer SDKs
- Q Developer streaming client

### Chat Client (chat-client/)
Chat interface implementation consuming mynah-ui for rendering

### Mynah UI (mynah-ui/)
Reusable UI component library for chat interfaces:
- Chat components
- Form elements
- Syntax highlighting
- Theming support

### IDE Clients (client/)
Platform-specific client implementations:
- VS Code extension
- JetBrains plugin
- Visual Studio extension

## Key Commands

### Installation
```bash
npm install                      # Install all workspace dependencies
```

### Building
```bash
npm run compile                  # Compile TypeScript
npm run build:mynah-ui          # Build mynah-ui
npm run build:flare             # Build mynah-ui + generate manifest
npm run package                 # Full build (includes mynah-ui)
```

### Testing
```bash
npm run test                    # Run all tests
npm run test:mynah-ui           # Run mynah-ui unit tests
npm run test:e2e:mynah-ui       # Run mynah-ui E2E tests
npm run test-unit               # Run unit tests only
npm run test-integ              # Run integration tests
```

### Code Quality
```bash
npm run lint                    # Lint all packages
npm run format                  # Format code
npm run format-staged           # Format staged files
```

### Cleaning
```bash
npm run clean                   # Clean build artifacts
```

## Dependency Management

### Internal Dependencies
Packages reference each other using file paths:
```json
{
  "dependencies": {
    "@aws/mynah-ui": "file:../mynah-ui"
  }
}
```

### External Dependencies
Managed at workspace root with hoisting to `node_modules/`

### Symlinks
npm creates symlinks for workspace packages:
```
node_modules/@aws/mynah-ui -> ../../mynah-ui
```

## Build Process

1. **Precompile**: Prepare core libraries
2. **Compile Core**: Build core packages
3. **Compile Servers**: Build language servers
4. **Compile Rest**: Build apps, clients, chat-client
5. **Build Mynah UI**: Bundle UI components
6. **Generate Manifest**: Create Flare manifest.json
7. **Package**: Create distribution artifacts

## Development Workflow

1. Clone repository
2. Run `npm install`
3. Make changes to any workspace package
4. Build: `npm run compile` or `npm run build:mynah-ui`
5. Test: `npm run test` or specific test commands
6. Package: `npm run package`

## CI/CD Integration

The monorepo structure enables:
- Single CI/CD pipeline for all packages
- Atomic deployments
- Consistent versioning
- Unified testing
- Shared tooling (ESLint, Prettier, TypeScript)

## Benefits

- **Unified Development**: All packages in one place
- **Atomic Changes**: Update multiple packages together
- **Shared Dependencies**: Reduced duplication
- **Consistent Tooling**: Same linting, formatting, testing
- **Simplified CI/CD**: Single pipeline
- **Type Safety**: Cross-package type checking
