#!/bin/bash

# Pre-Commit Sync Validator Hook
# Validates documentation-code-test synchronization before commits
# Checks Sync Score against configured threshold

ORCHESTRA_CONFIG=".orchestra/config.json"
SYNC_STATE=".orchestra/sync-state.json"

if [ ! -f "$ORCHESTRA_CONFIG" ]; then
    exit 0
fi

VALIDATE_ON_COMMIT=$(jq -r '.workflow.validateOnCommit // false' "$ORCHESTRA_CONFIG" 2>/dev/null || echo "false")

if [ "$VALIDATE_ON_COMMIT" != "true" ]; then
    exit 0
fi

SYNC_THRESHOLD=$(jq -r '.workflow.syncThreshold // 70' "$ORCHESTRA_CONFIG" 2>/dev/null || echo "70")
BLOCK_ON_FAILURE=$(jq -r '.quality.blockCommitOnFailure // false' "$ORCHESTRA_CONFIG" 2>/dev/null || echo "false")

echo "🔍 Running Sync Validation..."

# Run sync validator if it exists
if [ -f ".orchestra/scripts/sync-validator.ts" ]; then
    if command -v ts-node &> /dev/null; then
        ts-node ".orchestra/scripts/sync-validator.ts" > /dev/null 2>&1
    elif command -v npx &> /dev/null; then
        npx ts-node ".orchestra/scripts/sync-validator.ts" > /dev/null 2>&1
    fi
fi

# Check sync state
if [ -f "$SYNC_STATE" ]; then
    SYNC_SCORE=$(jq -r '.syncScore // 0' "$SYNC_STATE" 2>/dev/null || echo "0")

    echo "📊 Sync Score: $SYNC_SCORE / 100 (Threshold: $SYNC_THRESHOLD)"

    if [ "$SYNC_SCORE" -lt "$SYNC_THRESHOLD" ]; then
        echo ""
        echo "⚠️  Sync Score is below threshold!"
        echo ""

        # Check for issues in requirements
        ISSUES=$(jq -r '.requirements[] | select(.warnings != null) | "\(.id): " + (.warnings | join(", "))'  "$SYNC_STATE" 2>/dev/null)

        if [ ! -z "$ISSUES" ]; then
            echo "Issues detected:"
            echo "$ISSUES" | sed 's/^/   - /'
            echo ""
        fi

        if [ "$BLOCK_ON_FAILURE" = "true" ]; then
            echo "❌ Commit blocked due to low Sync Score"
            exit 1
        else
            echo "⚠️  Proceeding (Sync validation not blocking in lenient mode)"
        fi
    else
        echo "✅ Sync validation passed"
    fi
fi

exit 0
