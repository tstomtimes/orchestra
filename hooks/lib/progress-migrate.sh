#!/bin/bash

# Orchestra Progress Tracker - Schema Migration
# Version: 2.0.0
# Migrates progress.json from v1.0 to v2.0 schema

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
PROGRESS_FILE="$PROJECT_ROOT/.orchestra/cache/progress.json"

# Source utility library
if [ -f "$SCRIPT_DIR/progress-utils.sh" ]; then
    source "$SCRIPT_DIR/progress-utils.sh"
else
    echo "ERROR: progress-utils.sh not found" >&2
    exit 1
fi

# Detect schema version
get_schema_version() {
    local file="$1"

    if [ ! -f "$file" ]; then
        echo "none"
        return
    fi

    # Try to parse schema version (handle malformed JSON)
    if ! jq empty "$file" 2>/dev/null; then
        # Malformed JSON
        echo "none"
        return
    fi

    local version=$(jq -r '.schemaVersion // "1.0"' "$file" 2>/dev/null || echo "1.0")
    echo "$version"
}

# Migrate from v1.0 to v2.0
migrate_v1_to_v2() {
    local file="$1"

    log_event "INFO" "Starting migration from v1.0 to v2.0"

    # Create backup
    local backup_file="${file}.v1.backup-$(date +%Y%m%d-%H%M%S)"
    cp "$file" "$backup_file"
    log_event "INFO" "Created backup: $backup_file"

    # Get current timestamp
    local timestamp=$(get_timestamp_ms)

    # Transform schema
    local temp_file="${file}.migrate.tmp"

    jq --argjson timestamp "$timestamp" '
        # Set schema version
        .schemaVersion = "2.0" |

        # Initialize metadata if missing
        .metadata = {
            sessionStartTime: $timestamp,
            lastUpdateTime: $timestamp,
            activeAgents: [],
            totalTokensEstimated: 0,
            completionRate: 0,
            totalTasks: 0,
            completedTasks: 0,
            inProgressTasks: 0,
            pendingTasks: 0,
            currentAgent: "Unknown"
        } |

        # Initialize history array
        .history = [] |

        # Transform todos: add new fields with defaults
        .todos |= map(. + {
            agent: "Unknown",
            startTime: $timestamp,
            lastUpdateTime: $timestamp,
            estimatedDuration: null,
            currentStep: null,
            totalSteps: null,
            tags: []
        })
    ' "$file" > "$temp_file"

    # Validate JSON before overwriting
    if jq empty "$temp_file" 2>/dev/null; then
        mv "$temp_file" "$file"
        log_event "INFO" "Migration to v2.0 completed successfully"

        # Recalculate metadata
        update_metadata "$file" "$timestamp"

        # Add migration history entry
        add_history_entry "$file" "$timestamp" "session_started" "null" "null" "Migrated from schema v1.0 to v2.0"

        echo "✅ Successfully migrated progress.json to schema v2.0"
        echo "   Backup saved to: $backup_file"
        return 0
    else
        log_event "ERROR" "Migration failed: invalid JSON generated"
        rm -f "$temp_file"
        echo "❌ Migration failed: Could not generate valid v2.0 schema" >&2
        return 1
    fi
}

# Main migration logic
main() {
    # Check if progress file exists
    if [ ! -f "$PROGRESS_FILE" ]; then
        log_event "INFO" "No progress.json found, nothing to migrate"
        # Initialize with v2.0 schema
        init_progress_file_if_missing "$PROGRESS_FILE"
        echo "✅ Initialized progress.json with schema v2.0"
        exit 0
    fi

    # Detect current schema version
    local version=$(get_schema_version "$PROGRESS_FILE")
    log_event "INFO" "Detected schema version: $version"

    case "$version" in
        "2.0")
            log_event "INFO" "Already using schema v2.0, no migration needed"
            echo "ℹ️  progress.json is already using schema v2.0"
            exit 0
            ;;
        "1.0")
            migrate_v1_to_v2 "$PROGRESS_FILE"
            exit $?
            ;;
        "none")
            log_event "INFO" "Invalid or empty progress.json, reinitializing"
            # Remove malformed file first, then initialize
            rm -f "$PROGRESS_FILE"
            init_progress_file_if_missing "$PROGRESS_FILE"
            echo "✅ Reinitialized progress.json with schema v2.0"
            exit 0
            ;;
        *)
            log_event "ERROR" "Unknown schema version: $version"
            echo "❌ Unknown schema version: $version" >&2
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
