# Mynah UI Integration

This document describes how mynah-ui is integrated into the language-servers monorepo.

## Overview

mynah-ui has been integrated as a workspace package within the language-servers monorepo. Instead of consuming mynah-ui as an npm package, we now build it locally and use the build artifacts directly.

## Structure

```
language-servers/
├── mynah-ui/              # Mynah UI source code
│   ├── src/               # Source files
│   ├── dist/              # Build output (generated)
│   │   ├── main.js        # Built UI bundle
│   │   └── manifest.json  # Flare language manifest (generated)
│   └── package.json       # Package configuration
├── chat-client/           # Consumes mynah-ui via workspace:*
└── script/
    └── generate-flare-manifest.ts  # Generates manifest.json
```

## Building

### Build mynah-ui only
```bash
npm run build:mynah-ui
```

### Generate Flare manifest
```bash
npm run generate:flare-manifest
```

### Build mynah-ui and generate manifest
```bash
npm run build:flare
```

### Full build (includes mynah-ui)
```bash
npm run package
```

## Flare Language Manifest

The manifest.json file is automatically generated after building mynah-ui and contains:

- **version**: Package version from package.json
- **ui.main**: Path to the main bundle (main.js)
- **ui.checksum**: SHA-256 checksum of the bundle
- **ui.size**: Bundle size in bytes
- **metadata**: Build information

Example manifest.json:
```json
{
  "version": "4.36.5",
  "ui": {
    "main": "main.js",
    "checksum": "abc123...",
    "size": 1234567
  },
  "metadata": {
    "name": "@aws/mynah-ui",
    "description": "AWS Toolkit VSCode and Intellij IDE Extension Mynah UI",
    "buildDate": "2025-01-01T00:00:00.000Z"
  }
}
```

## Consuming mynah-ui

Packages within the monorepo can depend on mynah-ui using workspace protocol:

```json
{
  "dependencies": {
    "@aws/mynah-ui": "workspace:*"
  }
}
```

This ensures the local build is used instead of fetching from npm.

## Development Workflow

1. Make changes to mynah-ui source code
2. Build mynah-ui: `npm run build:mynah-ui`
3. Generate manifest: `npm run generate:flare-manifest`
4. Test changes in consuming packages (e.g., chat-client)

## CI/CD Integration

The `package` script automatically builds mynah-ui and generates the manifest as part of the standard build process.
