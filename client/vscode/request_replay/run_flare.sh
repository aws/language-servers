#!/bin/bash

# Script to continuously monitor flare_input.jsonl and process new data
# This script handles a long-running Node process for a pub-sub system

# Define file paths
INPUT_FILE="io/flare_input.jsonl"
OUTPUT_FILE="io/flare_output.jsonl"
NODE_SCRIPT="/Users/dhanak/KiwiFlare/language-servers/app/aws-lsp-codewhisperer-runtimes/out/token-standalone.js"

# TODO backup existing files & run tests

# Create named pipes for continuous processing
PIPE_IN=$(mktemp -u)
mkfifo "$PIPE_IN"

# Cleanup function to remove pipes and kill processes on exit
cleanup() {
    echo "Cleaning up resources..."
    rm -f "$PIPE_IN"
    [[ -n $NODE_PID ]] && kill $NODE_PID 2>/dev/null
    [[ -n $TAIL_PID ]] && kill $TAIL_PID 2>/dev/null
    exit 0
}

# Set up trap for clean exit
trap cleanup SIGINT SIGTERM EXIT

# Start the Node process with the pipe as input
cat "$PIPE_IN" | node --nolazy --inspect=6012 --enable-source-maps "$NODE_SCRIPT" --stdio --pre-init-encryption --set-credentials-encryption-key > "$OUTPUT_FILE" &
NODE_PID=$!

echo "Node process started with PID: $NODE_PID"
echo "Monitoring $INPUT_FILE for new data..."

# Use tail to continuously monitor the input file and feed new data to the pipe
tail -f "$INPUT_FILE" > "$PIPE_IN" &
TAIL_PID=$!

# Keep the script running until manually terminated
echo "Press Ctrl+C to stop the process"
wait $NODE_PID
