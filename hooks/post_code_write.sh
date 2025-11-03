#!/bin/bash

# Post Code Write Hook
# Runs after TodoWrite tool usage
# Performs: Progress tracking display, auto-linting, code formatting

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Function to display progress tracker output
display_progress_tracking() {
    # Run the progress display hook
    if [ -f "$PROJECT_ROOT/hooks/progress-tracker-display.sh" ]; then
        bash "$PROJECT_ROOT/hooks/progress-tracker-display.sh"
    fi
}

# Function to run linting/formatting
run_code_quality_checks() {
    ORCHESTRA_CONFIG=".orchestra/config.json"

    if [ ! -f "$ORCHESTRA_CONFIG" ]; then
        return 0
    fi

    CHANGED_FILE="$1"
    AUTO_LINT=$(jq -r '.workflow.autoLint // false' "$ORCHESTRA_CONFIG" 2>/dev/null || echo "false")
    AUTO_FIX_LINT=$(jq -r '.workflow.autoFixLint // false' "$ORCHESTRA_CONFIG" 2>/dev/null || echo "false")

    if [ "$AUTO_LINT" = "true" ] || [ "$AUTO_FIX_LINT" = "true" ]; then
        echo "🔧 Running linting and formatting..."

        # TypeScript/JavaScript files
        if [[ "$CHANGED_FILE" =~ \.(ts|tsx|js|jsx)$ ]]; then
            if command -v eslint &> /dev/null; then
                if [ "$AUTO_FIX_LINT" = "true" ]; then
                    echo "   Applying ESLint fixes..."
                    eslint --fix "$CHANGED_FILE" 2>/dev/null || true
                else
                    echo "   Checking with ESLint..."
                    eslint "$CHANGED_FILE" 2>/dev/null || true
                fi
            fi

            if command -v prettier &> /dev/null; then
                echo "   Applying Prettier formatting..."
                prettier --write "$CHANGED_FILE" 2>/dev/null || true
            fi
        fi

        # Python files
        if [[ "$CHANGED_FILE" =~ \.py$ ]]; then
            if command -v black &> /dev/null; then
                echo "   Applying Black formatting..."
                black "$CHANGED_FILE" 2>/dev/null || true
            fi

            if command -v isort &> /dev/null; then
                echo "   Sorting imports with isort..."
                isort "$CHANGED_FILE" 2>/dev/null || true
            fi
        fi

        echo "✅ Linting and formatting complete"
    fi
}

# Main execution
display_progress_tracking

if [ -n "$1" ]; then
    run_code_quality_checks "$1"
fi

exit 0
