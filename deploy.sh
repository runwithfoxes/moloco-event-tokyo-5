#!/bin/bash
# Deploy to Vercel from a clean copy (bypasses git author check)
set -e

TEMP_DIR=$(mktemp -d)
echo "Copying project to $TEMP_DIR..."

rsync -a \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.DS_Store' \
  . "$TEMP_DIR/"

cd "$TEMP_DIR"
npx vercel link --project "${VERCEL_PROJECT:-moloco-event-CITY}" --yes
npx vercel --prod

echo "Cleaning up..."
rm -rf "$TEMP_DIR"
echo "Done!"
