#!/usr/bin/env bash
# Auto-commit helper for agent tasks
# Creates professional git commits with proper prefixes and messages

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Configuration
COMMIT_LANGUAGE="${COMMIT_LANGUAGE:-en}"  # en or ja
AUTO_COMMIT_ENABLED="${AUTO_COMMIT_ENABLED:-true}"

# Check if auto-commit is enabled
if [ "$AUTO_COMMIT_ENABLED" != "true" ]; then
    exit 0
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "⚠️  Not a git repository. Skipping auto-commit." >&2
    exit 0
fi

# Check if there are changes to commit
if git diff --quiet && git diff --cached --quiet; then
    echo "ℹ️  No changes to commit." >&2
    exit 0
fi

# Usage check
if [ $# -lt 3 ]; then
    echo "Usage: $0 <prefix> <reason> <action>" >&2
    echo "" >&2
    echo "Prefixes:" >&2
    echo "  feat     - A new feature" >&2
    echo "  fix      - A bug fix" >&2
    echo "  docs     - Documentation only changes" >&2
    echo "  style    - Code style changes (formatting, whitespace)" >&2
    echo "  refactor - Code change that neither fixes a bug nor adds a feature" >&2
    echo "  perf     - Performance improvement" >&2
    echo "  test     - Adding or correcting tests" >&2
    echo "  chore    - Build process or auxiliary tool changes" >&2
    echo "" >&2
    echo "Examples:" >&2
    echo "  # English" >&2
    echo "  $0 feat 'to support voice notifications' 'Add ElevenLabs TTS integration'" >&2
    echo "  # Result: feat: Add ElevenLabs TTS integration (to support voice notifications)" >&2
    echo "" >&2
    echo "  # Japanese" >&2
    echo "  $0 feat '音声通知をサポートするため' 'ElevenLabs TTS統合を追加'" >&2
    echo "  # Result: feat: ElevenLabs TTS統合を追加 (音声通知をサポートするため)" >&2
    exit 1
fi

PREFIX="$1"
REASON="$2"
ACTION="$3"
AGENT="${4:-}"  # Optional agent name

# Validate prefix
valid_prefixes=("feat" "fix" "docs" "style" "refactor" "perf" "test" "chore")
if [[ ! " ${valid_prefixes[@]} " =~ " ${PREFIX} " ]]; then
    echo "❌ Invalid prefix: $PREFIX" >&2
    echo "   Valid prefixes: ${valid_prefixes[*]}" >&2
    exit 1
fi

# Generate commit message with reason in parentheses
# Format: prefix: <action> (<reason>)
# Works naturally in both English and Japanese
COMMIT_MESSAGE="${PREFIX}: ${ACTION} (${REASON})"

# Add agent attribution if provided
if [ -n "$AGENT" ]; then
    AGENT_FOOTER="

Co-Authored-By: ${AGENT} <noreply@orchestra-plugin>"
else
    AGENT_FOOTER=""
fi

# Stage all changes
git add -A

# Create commit
git commit -m "${COMMIT_MESSAGE}${AGENT_FOOTER}" || {
    echo "❌ Commit failed" >&2
    exit 1
}

# Get commit hash
COMMIT_HASH=$(git rev-parse --short HEAD)

echo "✅ Auto-commit created: $COMMIT_HASH"
echo "   Message: $COMMIT_MESSAGE"

exit 0
