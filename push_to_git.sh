#!/bin/bash
echo "Re-initializing Git repository to purge heavy history..."
# Remove the old git directory to delete all large history
rm -rf .git

# Initialize a clean repository
git init
echo "Initialized fresh, clean Git repository."

# Add files (respecting the .gitignore)
git add .

# Create the first commit (which will be very light now, ~3-4MB)
git commit -m "Initial commit - Replicated VerifyIt with live multiplayer and verifyit_ai.db"

# Set branch name to main
git branch -M main

# Set the remote URL
git remote add origin https://github.com/krishaygarg/verifyit_v4.git
echo "Set remote origin to https://github.com/krishaygarg/verifyit_v4.git"

# Push to GitHub
echo "Pushing codebase to GitHub (main branch)..."
git push -u origin main --force
