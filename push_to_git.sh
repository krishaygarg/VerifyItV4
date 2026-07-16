#!/bin/bash
echo "Adding updated files to Git..."
git add .

echo "Committing changes..."
git commit -m "Add project documentation README and production environment variables"

echo "Pushing changes to GitHub (main branch)..."
git push origin main
