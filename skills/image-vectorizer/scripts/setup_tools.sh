#!/bin/bash

# setup_tools.sh - Install vtracer and potrace for image-vectorizer skill
# Supports macOS (ARM64 and x86_64)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_DIR="$SCRIPT_DIR/bin"
mkdir -p "$BIN_DIR"

ARCH=$(uname -m)
OS=$(uname -s)

echo "Setting up vectorization tools for $OS ($ARCH)..."

# 1. Install VTracer
if [[ "$OS" == "Darwin" ]]; then
    if [[ "$ARCH" == "arm64" ]]; then
        VTRACER_URL="https://github.com/visioncortex/vtracer/releases/latest/download/vtracer-aarch64-apple-darwin.tar.gz"
    else
        VTRACER_URL="https://github.com/visioncortex/vtracer/releases/latest/download/vtracer-x86_64-apple-darwin.tar.gz"
    fi
    
    echo "Downloading vtracer from $VTRACER_URL..."
    curl -L "$VTRACER_URL" -o "$BIN_DIR/vtracer.tar.gz"
    tar -xzf "$BIN_DIR/vtracer.tar.gz" -C "$BIN_DIR"
    rm "$BIN_DIR/vtracer.tar.gz"
    chmod +x "$BIN_DIR/vtracer"
    echo "vtracer installed to $BIN_DIR/vtracer"
else
    echo "Automatic installation for $OS not yet implemented. Please install vtracer manually."
fi

# 2. Check for Potrace (often available via brew)
if command -v potrace >/dev/null 2>&1; then
    echo "potrace is already installed in system path."
else
    if [[ "$OS" == "Darwin" ]]; then
        echo "potrace not found. Suggestion: brew install potrace"
        # We don't auto-install brew packages to avoid side effects without owner's consent
        # but the skill will use the system one if available.
    fi
fi

echo "Setup complete."
