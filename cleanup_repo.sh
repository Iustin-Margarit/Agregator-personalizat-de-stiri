#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# The folder to clean up.
FOLDER_TO_CLEAN="supabase"

# A list of files to remove from the git history.
# We will remove any file that matches the patterns in supabase/.gitignore
# and also some other patterns that are common for supabase projects.
FILES_TO_REMOVE=$(git ls-files | grep -E "^$FOLDER_TO_CLEAN/(\.branches/|\.temp/|functions/.*\/node_modules/|functions/.*\.npmrc|\.log$)" || true)

if [ -z "$FILES_TO_REMOVE" ]; then
  echo "No files to remove from the history."
  exit 0
fi

echo "The following files will be removed from the git history:"
echo "$FILES_TO_REMOVE"

# Ask for confirmation before proceeding.
read -p "Are you sure you want to continue? This will rewrite the git history. (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  exit 1
fi

# Rewrite the history of all branches.
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch $FILES_TO_REMOVE" --prune-empty --tag-name-filter cat -- --all

# Clean up the git repository.
echo "Cleaning up the repository..."
git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now

echo "History rewritten successfully."
echo "You should now force-push the changes to your remote repository."
echo "Run the following command for each of your branches:"
echo "git push origin <branch-name> --force"