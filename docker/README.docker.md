# Docker Build Environment for Language Servers

This Docker setup provides a consistent environment for building the AWS language servers and language server runtimes.

## Prerequisites

- Docker
- Docker Compose

## Getting Started

### Building and Starting the Container

```bash
# From the language-servers directory
docker-compose build
docker-compose up -d
```

### Configuring Repository Branches

You can specify which branches to use for both repositories by modifying the `docker-compose.yml` file:

```yaml
services:
  language-servers-build:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        # Configure branches here
        RUNTIMES_BRANCH: main
        SERVERS_BRANCH: floralph/nep-flare
```

By default, the setup uses:
- language-server-runtimes: `main` branch
- language-servers: `floralph/nep-flare` branch

### Accessing the Container

```bash
docker-compose exec language-servers-build zsh
```

### What's Included

- Node.js 20.14.0
- Git
- Neovim (basic installation)
- Zsh with Oh My Zsh
- Pre-cloned repositories:
  - language-server-runtimes (main branch)
  - language-servers (floralph/nep-flare branch)
- Pre-built language servers

### Working with the Code

The repositories are cloned and built during the Docker image creation:

- `/workspace/language-server-runtimes` - Contains the language server runtimes
- `/workspace/language-servers` - Contains the language servers

### Rebuilding the Language Servers

If you need to rebuild the language servers after making changes:

```bash
# Inside the container
cd /workspace/language-servers
npm run compile
npm run package
```

### Building CodeWhisperer Language Server

**IMPORTANT:** When building the CodeWhisperer language server, you must use:

```bash
# Inside the container
cd /workspace/language-servers
source build-codewhisperer.sh
```

Using `source` is required to properly set up the environment variables needed for the build process.

### Stopping the Container

```bash
# From your host machine
docker-compose down
```

## Advanced Usage

### Mounting Local Directories

If you want to mount your local directories to persist changes, modify the `docker-compose.yml` file:

```yaml
services:
  language-servers-build:
    # ... other settings ...
    volumes:
      - ./:/workspace/language-servers
      # Uncomment if you want to mount your local language-server-runtimes repo
      # - ../language-server-runtimes:/workspace/language-server-runtimes
```

This allows you to edit files on your host machine and have the changes reflected in the container.
