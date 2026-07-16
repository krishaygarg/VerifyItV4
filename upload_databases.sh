#!/bin/bash
# Exit on error
set -e

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
  echo "GitHub CLI (gh) is not installed."
  echo "Installing gh via Homebrew..."
  brew install gh
fi

# Ensure user is authenticated with GitHub CLI
echo "Checking GitHub CLI authentication status..."
if ! gh auth status &> /dev/null; then
  echo "You are not logged into GitHub CLI."
  echo "Please log in by running: gh auth login"
  exit 1
fi

echo "Creating GitHub Release 'v1.0.0-database' and uploading databases..."

# Delete release if it already exists to allow overwrite
gh release delete v1.0.0-database --yes 2>/dev/null || true
git tag -d v1.0.0-database 2>/dev/null || true
git push origin :refs/tags/v1.0.0-database 2>/dev/null || true

# Create new release and upload verifyit.db and verifyit_ai.db
gh release create v1.0.0-database \
  ./verifyit.db \
  ./verifyit_ai.db \
  --title "Database Assets" \
  --notes "SQLite database assets for VerifyIt! game replication."

echo ""
echo "--------------------------------------------------------"
echo "Databases uploaded successfully!"
echo "Your download links are:"
echo "1. Normal Database URL:"
echo "   https://github.com/krishaygarg/verifyit_v4/releases/download/v1.0.0-database/verifyit.db"
echo "2. AI Database URL:"
echo "   https://github.com/krishaygarg/verifyit_v4/releases/download/v1.0.0-database/verifyit_ai.db"
echo "--------------------------------------------------------"
