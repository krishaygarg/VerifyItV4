#!/bin/bash
echo "Adding updated files to Git..."
git add .

echo "Committing changes..."
git commit -m "Update server.js to support automatic startup database download"

echo "Pushing changes to GitHub (main branch)..."
git push origin main
