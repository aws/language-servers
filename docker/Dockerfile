FROM node:20.14.0

# Set ARGs for branch configuration with defaults
ARG RUNTIMES_BRANCH=main
ARG SERVERS_BRANCH=floralph/nep-flare

# Install necessary tools including basic Neovim and zsh
RUN apt-get update && apt-get install -y \
    git \
    curl \
    neovim \
    zsh \
    && rm -rf /var/lib/apt/lists/*

# Install Oh My Zsh
RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended

# Set working directory to /workspace
WORKDIR /workspace

# Clone repositories with specified branches
RUN git clone -b ${RUNTIMES_BRANCH} https://github.com/aws/language-server-runtimes.git /workspace/language-server-runtimes && \
    git clone -b ${SERVERS_BRANCH} https://github.com/aws/language-servers.git /workspace/language-servers

# Print branch information for verification
RUN echo "Using language-server-runtimes branch: ${RUNTIMES_BRANCH}" && \
    echo "Using language-servers branch: ${SERVERS_BRANCH}"

# Set up language-server-runtimes
WORKDIR /workspace/language-server-runtimes
RUN npm install && \
    cd ./runtimes && \
    npm run prepub

# Set up language-servers
WORKDIR /workspace/language-servers
RUN npm install && \
    npm run clean && \
    npm link /workspace/language-server-runtimes/runtimes/out && \
    npm link @aws/language-server-runtimes && \
    npm link @aws/language-server-runtimes-types

# Compile the entire project first to ensure all dependencies are built
RUN npm run compile

# Build the CodeWhisperer language server
RUN npm run package

# Copy the built file to an easily accessible location
RUN mkdir -p /output && \
    find /workspace/language-servers -name "aws-lsp-codewhisperer.js" -type f -exec cp {} /output/ \; || echo "File not found, will be mounted from host"

# Set the default command
WORKDIR /workspace/language-servers
CMD ["/bin/zsh"]
