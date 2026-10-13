#!/usr/bin/env bash

GIT_ROOT_DIR=$(git rev-parse --show-toplevel)

npx prettier --write "$GIT_ROOT_DIR/src"

find "$GIT_ROOT_DIR/src" \
  -type f \
  \( -iname '*.js' \
  -or -iname '*.ts' \
  -or -iname '*.css' \) | xargs -I{} sed -Ei 's/[[:space:]]*$//' "{}"
