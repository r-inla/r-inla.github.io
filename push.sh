#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 \"commit message\"" >&2
  exit 1
fi

COMMIT_MSG=$1

git add -A

if [[ -z $(git status --porcelain) ]]; then
  echo "Nothing to commit."
  exit 0
fi

git commit -m "${COMMIT_MSG}"
git push origin gh-pages
