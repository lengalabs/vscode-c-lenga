#!/bin/bash

set -euo pipefail

# ================================
# Configuration
# ================================
GITHUB_USER="lengalab"                 # GitHub username or org
GITHUB_REPO="lenga"                     # Repository name
BRANCH_OR_COMMIT="feat/proto-definitions" # # Can be branch or pinned commit hash
REMOTE_DIRECTORY="lenga-server/proto"          # Directory in the repo you want
PROTOS_DIR="rpc/protos"          # Relative to git repository root
GENERATED_DIR="rpc/generated"          # Relative to git repository root

# ================================
# Safety checks for variables
# ================================
for var_name in GITHUB_USER GITHUB_REPO BRANCH_OR_COMMIT REMOTE_DIRECTORY PROTOS_DIR; do
    if [ -z "${!var_name}" ]; then
        echo "Error: $var_name is not set. Exiting."
        exit 1
    fi
done

# ================================
# Dependencies check
# ================================
for cmd in curl jq git; do
    if ! command -v "$cmd" &> /dev/null; then
        echo "Error: $cmd is required but not installed."
        exit 1
    fi
done

# ================================
# Determine Git root
# ================================
if ! GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null); then
    echo "Error: not inside a Git repository."
    exit 1
fi

PROTOS_DIR="$GIT_ROOT/$PROTOS_DIR"

# Clean protos directory safely
if [ -d "$PROTOS_DIR" ]; then
    echo "Cleaning existing protos directory: $PROTOS_DIR"
    rm -rf "$PROTOS_DIR"
fi
mkdir -p "$PROTOS_DIR"

# ================================
# Fetch file list from GitHub API
# ================================
RESPONSE=$(curl -s "https://api.github.com/repos/$GITHUB_USER/$GITHUB_REPO/contents/$REMOTE_DIRECTORY?ref=$BRANCH_OR_COMMIT")

# Handle API errors
if echo "$RESPONSE" | jq -e 'has("message")' >/dev/null; then
    echo "GitHub API error: $(echo "$RESPONSE" | jq -r .message)"
    exit 1
fi

# Determine if it's a directory or a single file
if echo "$RESPONSE" | jq 'type' | grep -q '"array"'; then
    FILES=$(echo "$RESPONSE" | jq -r '.[] | select(.type=="file") | .path')
else
    FILES=$(echo "$RESPONSE" | jq -r '.path')
fi

# ================================
# Download files
# ================================
for FILE in $FILES; do
    RELATIVE_PATH="${FILE#$REMOTE_DIRECTORY/}"
    LOCAL_PATH="$PROTOS_DIR/$RELATIVE_PATH"
    mkdir -p "$(dirname "$LOCAL_PATH")"
    echo "Downloading $FILE..."
    curl -s -L "https://raw.githubusercontent.com/$GITHUB_USER/$GITHUB_REPO/$BRANCH_OR_COMMIT/$FILE" -o "$LOCAL_PATH"
done

echo "Directory '$REMOTE_DIRECTORY' downloaded to '$PROTOS_DIR'."

GENERATED_DIR="$GIT_ROOT/$GENERATED_DIR"

if [ -d "$GENERATED_DIR" ]; then
    echo "Cleaning existing generated bindings directory: $GENERATED_DIR"
    rm -rf "$GENERATED_DIR"
fi
mkdir -p "$GENERATED_DIR"

echo "Generating bindings"

protoc -I=$PROTOS_DIR --plugin=protoc-gen-ts_proto=./node_modules/.bin/protoc-gen-ts_proto --ts_proto_out=$GENERATED_DIR --ts_proto_opt=esModuleInterop=true,useOptionals=messages,outputServices=grpc-js,env=node,oneof=unions $PROTOS_DIR/*.proto

echo "Done! Bindings can be found at '$GENERATED_DIR'"