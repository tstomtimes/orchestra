#!/usr/bin/env bash
# Sync .claude.json settings to .claude/settings.local.json
# This ensures user-defined settings in .claude.json take priority over auto-generated settings

set -euo pipefail

# Detect project root
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$PROJECT_ROOT"

# Configuration
CLAUDE_JSON="$PROJECT_ROOT/.claude.json"
SETTINGS_LOCAL="$PROJECT_ROOT/.claude/settings.local.json"

# Determine verbosity (silent mode for hooks, verbose for setup)
SILENT="${1:-false}"

log() {
    if [ "$SILENT" != "true" ]; then
        echo "$@"
    fi
}

log_error() {
    echo "$@" >&2
}

# Check if .claude.json exists
if [ ! -f "$CLAUDE_JSON" ]; then
    log_error "Warning: .claude.json not found at $CLAUDE_JSON"
    exit 0  # Non-fatal, exit gracefully
fi

# Check if jq is available
if ! command -v jq &> /dev/null; then
    log_error "Warning: jq is not installed. Cannot sync settings."
    log_error "Install with: brew install jq (macOS) or apt install jq (Linux)"
    exit 0  # Non-fatal, exit gracefully
fi

# Read dangerouslySkipPermissions from .claude.json
SKIP_PERMISSIONS=$(jq -r '.dangerouslySkipPermissions // empty' "$CLAUDE_JSON" 2>/dev/null)

if [ -z "$SKIP_PERMISSIONS" ] || [ "$SKIP_PERMISSIONS" = "null" ]; then
    log "No dangerouslySkipPermissions found in .claude.json, skipping sync."
    exit 0
fi

# Ensure .claude directory exists
mkdir -p "$PROJECT_ROOT/.claude"

# Check if settings.local.json exists
if [ ! -f "$SETTINGS_LOCAL" ]; then
    log "Creating new settings.local.json with dangerouslySkipPermissions..."

    # Create new settings.local.json with dangerouslySkipPermissions
    jq -n \
        --argjson skipPerms "$(echo "$SKIP_PERMISSIONS")" \
        '{dangerouslySkipPermissions: $skipPerms}' \
        > "$SETTINGS_LOCAL"

    log "✓ Created $SETTINGS_LOCAL with dangerouslySkipPermissions"
    exit 0
fi

# Read current dangerouslySkipPermissions from settings.local.json
CURRENT_SKIP_PERMISSIONS=$(jq -r '.dangerouslySkipPermissions // empty' "$SETTINGS_LOCAL" 2>/dev/null || echo "")

# Check if settings.local.json has a permissions section
HAS_PERMISSIONS=$(jq 'has("permissions")' "$SETTINGS_LOCAL" 2>/dev/null || echo "false")

# Determine if we need to update
NEEDS_UPDATE=false

if [ "$SKIP_PERMISSIONS" != "$CURRENT_SKIP_PERMISSIONS" ]; then
    NEEDS_UPDATE=true
fi

# If dangerouslySkipPermissions contains "*", permissions section should be removed
if echo "$SKIP_PERMISSIONS" | jq -e 'contains(["*"])' > /dev/null 2>&1; then
    if [ "$HAS_PERMISSIONS" = "true" ]; then
        NEEDS_UPDATE=true
    fi
fi

if [ "$NEEDS_UPDATE" = "true" ]; then
    log "Syncing dangerouslySkipPermissions from .claude.json to settings.local.json..."

    # Backup existing settings.local.json
    cp "$SETTINGS_LOCAL" "$SETTINGS_LOCAL.backup" 2>/dev/null || true

    # If dangerouslySkipPermissions contains "*", remove permissions section
    # as it's redundant when all permissions are skipped
    if echo "$SKIP_PERMISSIONS" | jq -e 'contains(["*"])' > /dev/null 2>&1; then
        log "Detected wildcard permission skip, removing redundant permissions section..."
        echo '{}' | jq \
            --argjson skipPerms "$(echo "$SKIP_PERMISSIONS")" \
            '{dangerouslySkipPermissions: $skipPerms}' \
            > "$SETTINGS_LOCAL.tmp"
    else
        # Merge dangerouslySkipPermissions into settings.local.json
        jq \
            --argjson skipPerms "$(echo "$SKIP_PERMISSIONS")" \
            '. + {dangerouslySkipPermissions: $skipPerms}' \
            "$SETTINGS_LOCAL" > "$SETTINGS_LOCAL.tmp"
    fi

    mv "$SETTINGS_LOCAL.tmp" "$SETTINGS_LOCAL"

    log "✓ Synced dangerouslySkipPermissions to $SETTINGS_LOCAL"
else
    log "Settings already in sync, no changes needed."
fi

exit 0
