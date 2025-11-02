# Mynah UI Integration

## Overview

mynah-ui is integrated as a workspace package within the language-servers monorepo for streamlined development. This eliminates the need to publish/consume from npm and enables atomic changes across UI and server components.

## Architecture

```
language-servers/
├── mynah-ui/                    # Mynah UI workspace package
│   ├── src/                     # Source code
│   ├── dist/                    # Build output (generated)
│   │   ├── main.js              # Bundled UI (2.4 MB)
│   │   └── manifest.json        # Flare language manifest
│   ├── example/                 # Development examples
│   ├── ui-tests/                # E2E tests
│   └── package.json
├── chat-client/                 # Consumes mynah-ui
│   └── package.json             # Depends on mynah-ui via file:../mynah-ui
├── script/
│   └── generate-flare-manifest.ts  # Manifest generator
└── docs/
    └── mynah-ui-integration.md  # This file
```

## Installation

Single command installs all dependencies:

```bash
npm install
```

This installs:
- Root dependencies
- mynah-ui dependencies (marked, highlight.js, sanitize-html, etc.)
- All workspace package dependencies
- Creates symlink: `node_modules/@aws/mynah-ui` → `mynah-ui/`

## Build Commands

### Build mynah-ui
```bash
npm run build:mynah-ui
```
Compiles TypeScript and bundles with webpack to `mynah-ui/dist/main.js`

### Generate Flare Manifest
```bash
npm run generate:flare-manifest
```
Creates `mynah-ui/dist/manifest.json` with version, checksum, size, and metadata

### Build mynah-ui + Generate Manifest
```bash
npm run build:flare
```
Combined command: builds mynah-ui then generates manifest

### Full Package Build
```bash
npm run package
```
Builds everything including mynah-ui and generates manifest

## Testing Commands

### Unit Tests
```bash
npm run test:mynah-ui
```
Runs mynah-ui unit tests with Jest

### E2E Tests
```bash
npm run test:e2e:mynah-ui
```
Runs mynah-ui end-to-end tests with Playwright

## Flare Language Manifest

The manifest.json is auto-generated after building mynah-ui:

```json
{
  "version": "4.36.5",
  "ui": {
    "main": "main.js",
    "checksum": "9700f99e3df272f91d37d67510b06362ff4f02bd02a09be30acb5a663a99435e",
    "size": 2482390
  },
  "metadata": {
    "name": "@aws/mynah-ui",
    "description": "AWS Toolkit VSCode and Intellij IDE Extension Mynah UI",
    "buildDate": "2025-11-02T00:49:38.043Z"
  }
}
```

**Fields:**
- `version`: From mynah-ui package.json
- `ui.main`: Bundle filename
- `ui.checksum`: SHA-256 hash for integrity verification
- `ui.size`: Bundle size in bytes
- `metadata`: Build information

## Consuming mynah-ui

Packages depend on mynah-ui using file path reference:

```json
{
  "dependencies": {
    "@aws/mynah-ui": "file:../mynah-ui"
  }
}
```

Import as usual:
```typescript
import { MynahUI } from '@aws/mynah-ui'

const mynahUI = new MynahUI({...})
```

## Development Workflow

1. Make changes to mynah-ui source
2. Build: `npm run build:mynah-ui`
3. Generate manifest: `npm run generate:flare-manifest`
4. Test in consuming packages (e.g., chat-client)
5. Run tests: `npm run test:mynah-ui`

## CI/CD Integration

The `package` script automatically:
1. Compiles TypeScript
2. Builds mynah-ui
3. Generates Flare manifest
4. Packages all workspaces

## Benefits

- **Single Source**: No separate repository
- **No npm Dependency**: Uses local builds
- **Atomic Changes**: UI + server changes together
- **Automatic Manifest**: Generated on every build
- **Workspace Linking**: Ensures local builds are used
- **Unified Testing**: Run all tests from root
