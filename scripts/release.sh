#!/usr/bin/env bash
set -e

TYPE="${1:-patch}"

if [[ "$TYPE" != "patch" && "$TYPE" != "minor" && "$TYPE" != "major" ]]; then
  echo "Usage: bun run release:{patch|minor|major}"
  exit 1
fi

# Get current version
CURRENT=$(cat package.json | grep '"version"' | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"

# Bump
case "$TYPE" in
  patch) PATCH=$((PATCH + 1)) ;;
  minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
  major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
esac

NEW="$MAJOR.$MINOR.$PATCH"

echo "Releasing v$NEW (was v$CURRENT)"

# Update package.json
sed -i '' "s/\"version\": \"$CURRENT\"/\"version\": \"$NEW\"/" package.json

# Commit, tag, push
git add package.json
git commit -m "chore: release v$NEW"
git tag "v$NEW"
git push origin main
git push origin "v$NEW"

echo "Released v$NEW"
