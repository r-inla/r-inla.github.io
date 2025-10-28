#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 \"commit message\"" >&2
  exit 1
fi

COMMIT_MSG=$1

REPO_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

cat <<'EOF' > "${REPO_ROOT}/.gitmodules"
[submodule "r-inla"]
	path = r-inla
	url = https://github.com/hrue/r-inla.git
EOF

git add .gitmodules
git add -A

if [[ -z $(git status --porcelain) ]]; then
  echo "Nothing to commit."
  exit 0
fi

git commit -m "${COMMIT_MSG}"
git push origin gh-pages
