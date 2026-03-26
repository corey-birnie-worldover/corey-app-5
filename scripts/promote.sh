#!/usr/bin/env bash
set -euo pipefail

target_branch="${1:-}"

if [[ -z "${target_branch}" ]]; then
  echo "Usage: ./scripts/promote.sh <staging|production>"
  exit 1
fi

case "${target_branch}" in
  staging)
    source_branch="main"
    ;;
  production)
    source_branch="staging"
    ;;
  *)
    echo "Unsupported target branch: ${target_branch}. Use staging or production."
    exit 1
    ;;
esac

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree must be clean before promotion."
  exit 1
fi

current_branch="$(git rev-parse --abbrev-ref HEAD)"

restore_branch() {
  if [[ "$(git rev-parse --abbrev-ref HEAD)" != "${current_branch}" ]]; then
    git switch "${current_branch}" >/dev/null 2>&1 || true
  fi
}

trap restore_branch EXIT

if git ls-remote --exit-code --heads origin "${target_branch}" >/dev/null 2>&1; then
  git fetch origin "${source_branch}" "${target_branch}"
  git switch "${target_branch}"
  git pull --ff-only origin "${target_branch}"
  git merge --ff-only "origin/${source_branch}"
else
  git fetch origin "${source_branch}"
  git switch -c "${target_branch}" "origin/${source_branch}"
fi

git push -u origin "${target_branch}"

echo "Promoted ${source_branch} -> ${target_branch}."
