#!/bin/bash

# Try to find node and npm
export PATH=$PATH:/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:$HOME/.npm-global/bin:$HOME/.local/bin:/opt/local/bin

# Try different package managers
if command -v npm &> /dev/null; then
    echo "Using npm..."
    npm run dev
elif command -v yarn &> /dev/null; then
    echo "Using yarn..."
    yarn dev
elif command -v pnpm &> /dev/null; then
    echo "Using pnpm..."
    pnpm dev
else
    echo "No package manager found. Please install Node.js and npm."
    echo "Visit https://nodejs.org/ for installation instructions."
    exit 1
fi 