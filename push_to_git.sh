#!/bin/bash
echo "Adding updated files to Git..."
git add .

echo "Committing changes..."
git commit -m "Optimize SQLite questions query flow to use two-pass ID fetch, preventing OOM crashes"

echo "Pushing changes to GitHub (main branch)..."
git push origin main
