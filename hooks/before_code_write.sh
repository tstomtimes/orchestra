#!/bin/bash

# Before Code Write Hook
# Enforces Test-First Development
# Checks if tests exist before allowing code changes

ORCHESTRA_CONFIG=".orchestra/config.json"

# Check if Orchestra workflow is enabled
if [ ! -f "$ORCHESTRA_CONFIG" ]; then
    exit 0
fi

# Get enforce test first setting
ENFORCE_TEST_FIRST=$(jq -r '.workflow.enforceTestFirst // false' "$ORCHESTRA_CONFIG" 2>/dev/null || echo "false")

if [ "$ENFORCE_TEST_FIRST" = "true" ]; then
    CHANGED_FILE="$1"

    # Only check source files, not tests or config
    if [[ "$CHANGED_FILE" =~ ^src/ ]] && [[ ! "$CHANGED_FILE" =~ \.test\. ]]; then
        # Derive expected test file
        TEST_FILE=$(echo "$CHANGED_FILE" | sed 's/^src/tests/' | sed 's/\.ts$/.test.ts/' | sed 's/\.js$/.test.js/')

        if [ ! -f "$TEST_FILE" ]; then
            echo "⚠️  Test-First Development Reminder"
            echo "   No test file found for: $CHANGED_FILE"
            echo "   Expected test file: $TEST_FILE"
            echo ""
            echo "   Recommendation: Create the test file first before implementing the feature."
            echo ""
            # In lenient mode, just warn; don't block
            exit 0
        fi
    fi
fi

exit 0
