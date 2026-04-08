#!/usr/bin/env bash
set -e

TYPEWRITER_DIR="$HOME/.typewriter/app"
BIN_DIR="$HOME/.local/bin"

echo "Installing Typewriter..."

# Check for Bun
if ! command -v bun &> /dev/null; then
  echo "Bun is required but not installed."
  echo "Installing Bun..."
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
fi

# Determine version to install
VERSION="${1:-latest}"

if [ "$VERSION" = "latest" ]; then
  DOWNLOAD_URL=$(curl -fsSL https://api.github.com/repos/nikolasgioannou/typewriter/releases/latest | grep '"tarball_url"' | sed 's/.*"tarball_url": "\(.*\)".*/\1/')
  if [ -z "$DOWNLOAD_URL" ]; then
    echo "No releases found. Installing from main branch..."
    DOWNLOAD_URL="https://github.com/nikolasgioannou/typewriter/archive/refs/heads/main.tar.gz"
  fi
else
  DOWNLOAD_URL="https://github.com/nikolasgioannou/typewriter/archive/refs/tags/v${VERSION}.tar.gz"
fi

# Download and extract
echo "Downloading..."
curl -fsSL "$DOWNLOAD_URL" -o /tmp/typewriter.tar.gz

rm -rf "$TYPEWRITER_DIR"
mkdir -p "$TYPEWRITER_DIR"
tar -xzf /tmp/typewriter.tar.gz -C "$TYPEWRITER_DIR" --strip-components=1
rm /tmp/typewriter.tar.gz

# Install dependencies
echo "Installing dependencies..."
cd "$TYPEWRITER_DIR" && bun install --production

# Ensure bin directory exists and symlink CLI
mkdir -p "$BIN_DIR"
ln -sf "$TYPEWRITER_DIR/bin/typewriter" "$BIN_DIR/typewriter"

# Check if BIN_DIR is in PATH
if ! echo "$PATH" | tr ':' '\n' | grep -qx "$BIN_DIR"; then
  SHELL_NAME=$(basename "$SHELL")
  case "$SHELL_NAME" in
    zsh)  RC_FILE="$HOME/.zshrc" ;;
    bash) RC_FILE="$HOME/.bashrc" ;;
    *)    RC_FILE="$HOME/.profile" ;;
  esac

  echo "export PATH=\"$BIN_DIR:\$PATH\"" >> "$RC_FILE"
  export PATH="$BIN_DIR:$PATH"
  echo "Added $BIN_DIR to PATH in $RC_FILE"
fi

VERSION_NUM=$(grep '"version"' "$TYPEWRITER_DIR/package.json" | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')

echo ""
echo "Typewriter v${VERSION_NUM} installed successfully!"
echo ""
echo "  Run:      typewriter"
echo "  Update:   typewriter update"
echo "  Version:  typewriter --version"
echo ""
