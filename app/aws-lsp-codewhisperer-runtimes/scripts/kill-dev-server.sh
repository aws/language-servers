#!/bin/bash

# Get the port number from the argument
PORT=$1

# Check if port is provided
if [ -z "$PORT" ]; then
  echo "Please provide a port number."
  exit 1
fi

# Check if the OS is Unix-based (Linux/macOS) or Windows
if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "darwin"* ]]; then
  # For Linux/macOS, use lsof to find and kill the process
  PID=$(lsof -t -i :$PORT)
  if [ -n "$PID" ]; then
    kill $PID
    echo "Process on port $PORT has been killed."
  else
    echo "No process found on port $PORT."
  fi
elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
  # For Windows, use netstat and taskkill
  PID=$(netstat -ano | findstr ":$PORT" | awk '{print $5}')
  if [ -n "$PID" ]; then
    taskkill /PID $PID
    echo "Process on port $PORT has been killed."
  else
    echo "No process found on port $PORT."
  fi
else
  echo "Unsupported OS: $OSTYPE"
  exit 1
fi