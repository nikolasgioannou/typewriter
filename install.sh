#!/usr/bin/env bash
set -e

TYPEWRITER_DIR="$HOME/.typewriter/app"
BIN_DIR="/usr/local/bin"

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

# Symlink CLI
echo "Linking CLI..."
if [ -w "$BIN_DIR" ]; then
  ln -sf "$TYPEWRITER_DIR/bin/typewriter" "$BIN_DIR/typewriter"
else
  sudo ln -sf "$TYPEWRITER_DIR/bin/typewriter" "$BIN_DIR/typewriter"
fi

VERSION_NUM=$(cat "$TYPEWRITER_DIR/package.json" | grep '"version"' | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')

echo ""
echo "Typewriter v${VERSION_NUM} installed successfully!"
echo ""
echo "  Run:      typewriter"
echo "  Update:   typewriter --update"
echo "  Version:  typewriter --version"
echo ""
