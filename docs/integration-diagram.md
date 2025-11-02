# Mynah UI Integration Diagram

## Monorepo Structure

```
language-servers/
│
├── mynah-ui/                           [Workspace Package]
│   ├── src/                            Source code
│   │   ├── components/                 UI components
│   │   ├── helper/                     Utilities
│   │   └── styles/                     SCSS styles
│   ├── dist/                           Build output
│   │   ├── main.js                     Bundled UI (2.4 MB)
│   │   └── manifest.json               Flare manifest
│   └── package.json                    private: true
│
├── chat-client/                        [Consumer]
│   ├── src/
│   │   └── client/
│   │       └── chat.ts                 import { MynahUI } from '@aws/mynah-ui'
│   └── package.json                    "@aws/mynah-ui": "file:../mynah-ui"
│
├── node_modules/
│   └── @aws/
│       └── mynah-ui -> ../../mynah-ui  [Symlink]
│
├── script/
│   └── generate-flare-manifest.ts      Generates manifest.json
│
└── package.json                        workspaces: [..., "mynah-ui"]
```

## Build Flow

```
┌─────────────────────────────────────────────────────────────┐
│  npm run build:flare                                        │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  npm run build:mynah-ui                                     │
│  ├── TypeScript compilation                                │
│  ├── Webpack bundling                                      │
│  └── Output: mynah-ui/dist/main.js                         │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  npm run generate:flare-manifest                            │
│  ├── Read main.js                                           │
│  ├── Calculate SHA-256 checksum                            │
│  ├── Get file size                                          │
│  └── Output: mynah-ui/dist/manifest.json                   │
└─────────────────────────────────────────────────────────────┘
```

## Dependency Resolution

```
chat-client imports @aws/mynah-ui
           │
           ▼
package.json: "@aws/mynah-ui": "file:../mynah-ui"
           │
           ▼
npm creates symlink: node_modules/@aws/mynah-ui -> mynah-ui/
           │
           ▼
Resolves to: mynah-ui/dist/main.js
```

## Test Flow

```
┌─────────────────────────────────────────────────────────────┐
│  npm run test:mynah-ui                                      │
│  └── npm run tests:unit --workspace=mynah-ui               │
│      └── jest --collect-coverage                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  npm run test:e2e:mynah-ui                                  │
│  └── npm run tests:e2e:local --workspace=mynah-ui          │
│      └── playwright test                                    │
└─────────────────────────────────────────────────────────────┘
```

## Package Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  npm run package                                            │
└─────────────────────────────────────────────────────────────┘
           │
           ├─► npm run compile (TypeScript)
           │
           ├─► npm run build:flare
           │   ├─► npm run build:mynah-ui
           │   └─► npm run generate:flare-manifest
           │
           └─► npm run package --workspaces --if-present
```

## Manifest Structure

```json
{
  "version": "4.36.5",                    ← From package.json
  "ui": {
    "main": "main.js",                    ← Bundle filename
    "checksum": "9700f99e...",            ← SHA-256 hash
    "size": 2482390                       ← Bytes
  },
  "metadata": {
    "name": "@aws/mynah-ui",              ← Package name
    "description": "...",                 ← Description
    "buildDate": "2025-11-02T00:49:38Z"   ← ISO timestamp
  }
}
```

## Workspace Linking

```
Root: npm install
  │
  ├─► Install root dependencies
  │
  ├─► Install mynah-ui dependencies
  │   ├─► marked
  │   ├─► highlight.js
  │   ├─► sanitize-html
  │   └─► ...
  │
  ├─► Install chat-client dependencies
  │   └─► @aws/mynah-ui (file:../mynah-ui)
  │
  └─► Create symlinks
      └─► node_modules/@aws/mynah-ui -> mynah-ui/
```
