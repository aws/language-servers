# Quick Reference

## Installation
```bash
npm install
```

## Build Commands
```bash
npm run build:mynah-ui          # Build mynah-ui only
npm run generate:flare-manifest # Generate manifest.json
npm run build:flare             # Build mynah-ui + manifest
npm run compile                 # Compile TypeScript
npm run package                 # Full build (everything)
```

## Test Commands
```bash
npm run test                    # All tests
npm run test:mynah-ui           # Mynah UI unit tests
npm run test:e2e:mynah-ui       # Mynah UI E2E tests
npm run test-unit               # Unit tests only
npm run test-integ              # Integration tests
```

## Code Quality
```bash
npm run lint                    # Lint all packages
npm run format                  # Format code
npm run format-staged           # Format staged files
```

## Clean
```bash
npm run clean                   # Clean build artifacts
```

## Key Files
- `mynah-ui/dist/main.js` - Built UI bundle
- `mynah-ui/dist/manifest.json` - Flare manifest
- `docs/mynah-ui-integration.md` - Integration guide
- `docs/monorepo-structure.md` - Structure reference

## Workspace Packages
- `app/*` - Language server runtimes
- `server/*` - Language servers
- `core/*` - Core libraries
- `chat-client` - Chat client
- `mynah-ui` - UI components

## Documentation
- [Documentation Index](docs/README.md)
- [Mynah UI Integration](docs/mynah-ui-integration.md)
- [Monorepo Structure](docs/monorepo-structure.md)
