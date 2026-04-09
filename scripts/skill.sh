#!/usr/bin/env bash
set -e

TYPEWRITER_DIR="${TYPEWRITER_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
SKILL_SOURCE="$TYPEWRITER_DIR/src/skill/SKILL.md"
TARGET_DIR="$(pwd)"

usage() {
  echo "Usage: typewriter skill [platform]"
  echo ""
  echo "Install the Typewriter agent skill for AI coding assistants."
  echo ""
  echo "Platforms:"
  echo "  claude     Install for Claude Code (.claude/skills/)"
  echo "  cursor     Install for Cursor (.cursor/skills/)"
  echo "  all        Install for all supported platforms (default)"
  echo ""
  echo "Examples:"
  echo "  typewriter skill          # Install for all platforms"
  echo "  typewriter skill claude   # Install for Claude Code only"
  echo "  typewriter skill cursor   # Install for Cursor only"
}

install_claude() {
  local dir="$TARGET_DIR/.claude/skills/typewriter"
  mkdir -p "$dir"
  cp "$SKILL_SOURCE" "$dir/SKILL.md"
  echo "  ✓ Claude Code  .claude/skills/typewriter/SKILL.md"
}

install_cursor() {
  local dir="$TARGET_DIR/.cursor/skills/typewriter"
  mkdir -p "$dir"
  cp "$SKILL_SOURCE" "$dir/SKILL.md"
  echo "  ✓ Cursor        .cursor/skills/typewriter/SKILL.md"
}

PLATFORM="${1:-all}"

case "$PLATFORM" in
  --help|-h)
    usage
    exit 0
    ;;
  claude)
    echo "Installing Typewriter skill for Claude Code..."
    install_claude
    ;;
  cursor)
    echo "Installing Typewriter skill for Cursor..."
    install_cursor
    ;;
  all)
    echo "Installing Typewriter skill..."
    install_claude
    install_cursor
    ;;
  *)
    echo "Unknown platform: $PLATFORM"
    usage
    exit 1
    ;;
esac

echo ""
echo "Done! Your AI assistant can now create .tw.json notebooks."
echo "Try asking it: \"Create a TypeScript notebook that analyzes this data\""
