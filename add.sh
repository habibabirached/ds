#!/bin/bash

# List of file extensions and specific filenames to include
extensions=("*.js" "*.json" "*.jsx" "*.css" "*.py" "*.yml" "*.sh" "*.md" "*.conf" "*.bat" "Makefile" "Dockerfile")

# List of files to exclude (files containing secrets)
excluded_files=("./bdc-s3-access/README.md" "./README.md" "./docker-compose-dev.yml")

# Function to check if a file is in the exclusion list
is_excluded() {
  local file=$1
  for excluded in "${excluded_files[@]}"; do
    if [[ "$file" == "$excluded" ]]; then
      return 0 # File is excluded
    fi
  done
  return 1 # File is not excluded
}

# Loop through the extensions and stage matching files recursively
for ext in "${extensions[@]}"; do
  echo "Processing files matching pattern: $ext"
  # Find files and process them
  find . -type f -name "$ext" | while read -r file; do
    if is_excluded "$file"; then
      echo "Skipping excluded file: $file"
    elif git ls-files --error-unmatch "$file" &>/dev/null; then
      echo "Skipping already tracked: $file"
    else
      git add "$file"
      echo "Added to staging: $file"
    fi
  done
done

# Output status to confirm which files were added
echo "Staged files with specified extensions from all directories:"
git status
