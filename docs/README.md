# Language Servers Documentation

## Quick Start

```bash
# Install all dependencies
npm install

# Build everything
npm run package

# Build mynah-ui only
npm run build:mynah-ui

# Run tests
npm run test
```

## Documentation Index

### Architecture & Structure
- **[Monorepo Structure](./monorepo-structure.md)** - Complete directory structure and workspace organization
- **[Mynah UI Integration](./mynah-ui-integration.md)** - How mynah-ui is integrated and consumed

### Language Servers
- **[Architecture](../ARCHITECTURE.md)** - Language server architecture overview
- Individual server READMEs in `server/*/README.md`

### Development
- **[Contributing](../CONTRIBUTING.md)** - Contribution guidelines
- **[Security](../SECURITY.md)** - Security policies

## Key Concepts

### Workspaces
This monorepo uses npm workspaces to manage multiple packages:
- `app/*` - Language server runtimes
- `server/*` - Language server implementations  
- `core/*` - Shared libraries
- `chat-client` - Chat client implementation
- `mynah-ui` - UI component library

### Build Process
1. TypeScript compilation
2. Mynah UI bundling with webpack
3. Flare manifest generation
4. Package creation

### Testing
- Unit tests: `npm run test-unit`
- Integration tests: `npm run test-integ`
- Mynah UI tests: `npm run test:mynah-ui`
- E2E tests: `npm run test:e2e:mynah-ui`

## Common Tasks

### Adding a New Package
1. Create package directory in appropriate workspace
2. Add `package.json` with workspace dependencies
3. Update root `package.json` workspaces if needed
4. Run `npm install`

### Updating Mynah UI
1. Make changes in `mynah-ui/src/`
2. Build: `npm run build:mynah-ui`
3. Generate manifest: `npm run generate:flare-manifest`
4. Test in consuming packages

### Debugging
- Use VS Code launch configurations
- Check individual package logs
- Review build output in `dist/` directories

## Resources

- [Language Server Protocol](https://microsoft.github.io/language-server-protocol/)
- [AWS Language Server Runtimes](https://github.com/aws/language-server-runtimes)
- [Mynah UI Documentation](../mynah-ui/docs/)
