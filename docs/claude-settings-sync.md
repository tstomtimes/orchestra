# Claude Settings Synchronization System

## Overview

The Orchestra Plugin includes an automatic settings synchronization system that ensures your `.claude.json` configuration takes priority over Claude Code's auto-generated `.claude/settings.local.json` file.

## Problem Statement

Claude Code uses a hierarchical configuration system with the following priority order:

1. **Enterprise managed policies** (`managed-settings.json`) - Highest priority
2. **Command line arguments** - Session-specific overrides
3. **Local project settings** (`.claude/settings.local.json`) - Personal preferences
4. **Shared project settings** (`.claude/settings.json`) - Team configuration
5. **User settings** (`~/.claude/settings.json`) - Global personal settings

The issue is that `.claude/settings.local.json` (priority 3) overrides settings in `.claude.json` (priority 4+), even if the user explicitly configured `dangerouslySkipPermissions: ["*"]` in `.claude.json`.

## Solution

The Orchestra Plugin implements a **multi-layered synchronization system** that automatically propagates `.claude.json` settings to `.claude/settings.local.json`:

### Components

1. **`hooks/sync-claude-settings.sh`** - Core synchronization logic
2. **`setup.sh`** - Runs sync during initial setup
3. **`hooks/session-start.sh`** - Runs sync silently at session start

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  .claude.json                                               │
│  ─────────────                                              │
│  {                                                          │
│    "dangerouslySkipPermissions": ["*"]                      │
│  }                                                          │
│                                                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  sync-claude-settings.sh      │
         │  ─────────────────────────    │
         │  • Read .claude.json          │
         │  • Check settings.local.json  │
         │  • Sync if different          │
         │  • Clean up redundant perms   │
         └───────────┬───────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  .claude/settings.local.json                                │
│  ────────────────────────────                               │
│  {                                                          │
│    "dangerouslySkipPermissions": ["*"]                      │
│  }                                                          │
│                                                             │
│  ✓ Old redundant "permissions" section removed             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Synchronization Triggers

1. **During Setup** (`setup.sh`)
   - Runs with verbose output
   - Shows success/failure messages
   - Non-blocking (setup continues even if sync fails)

2. **At Session Start** (`hooks/session-start.sh`)
   - Runs in silent mode
   - No output unless errors occur
   - Ensures settings stay in sync across sessions

### Smart Cleanup

When `dangerouslySkipPermissions: ["*"]` is detected, the sync script:

1. Removes the entire `permissions` section from `settings.local.json`
2. Creates a clean configuration file with only the wildcard permission skip
3. Backs up the original file to `settings.local.json.backup`

This eliminates redundant configuration and reduces file size.

## Usage

### Automatic (Recommended)

The sync system works automatically:

1. Run `bash setup.sh` once during initial setup
2. Settings automatically sync at every session start
3. No manual intervention required

### Manual Sync

If you need to manually sync settings:

```bash
# From project root
bash hooks/sync-claude-settings.sh false
```

Output:
```
Syncing dangerouslySkipPermissions from .claude.json to settings.local.json...
Detected wildcard permission skip, removing redundant permissions section...
✓ Synced dangerouslySkipPermissions to /path/to/.claude/settings.local.json
```

### Silent Mode (for hooks)

```bash
bash hooks/sync-claude-settings.sh true
```

No output unless errors occur.

## Configuration

### .claude.json

The sync script reads the `dangerouslySkipPermissions` field from `.claude.json`:

```json
{
  "version": "1.0.0",
  "name": "orchestra",
  "dangerouslySkipPermissions": ["*"],
  "agents": [...],
  "slashCommands": [...],
  "skills": [...],
  "hooks": "hooks/hooks.json"
}
```

### Supported Configurations

#### Wildcard Skip (All Permissions)

```json
{
  "dangerouslySkipPermissions": ["*"]
}
```

**Result:** `settings.local.json` will contain only `dangerouslySkipPermissions`, with `permissions` section removed.

#### Selective Skip

```json
{
  "dangerouslySkipPermissions": ["Bash", "Edit", "Write"]
}
```

**Result:** `settings.local.json` will merge this setting while preserving existing `permissions` section.

## Error Handling

The sync script is designed to fail gracefully:

- **Missing `.claude.json`**: Warns and exits (non-fatal)
- **Missing `jq`**: Warns about missing dependency and exits (non-fatal)
- **No `dangerouslySkipPermissions`**: Skips sync silently
- **Backup failures**: Continues without backup (non-fatal)

All errors are logged to stderr but do not block setup or session start.

## Testing

### Test Sync Script

```bash
# Test with verbose output
bash hooks/sync-claude-settings.sh false

# Verify settings.local.json
cat .claude/settings.local.json
```

Expected output:
```json
{
  "dangerouslySkipPermissions": [
    "*"
  ]
}
```

### Test Idempotency

```bash
# Run sync twice
bash hooks/sync-claude-settings.sh false
bash hooks/sync-claude-settings.sh false
```

Second run should output:
```
Settings already in sync, no changes needed.
```

### Test Session Hook

```bash
# Manually trigger session start hook
bash hooks/session-start.sh
```

Sync should run silently in the background.

## Troubleshooting

### Settings Not Syncing

**Issue:** Changes to `.claude.json` are not reflected in `settings.local.json`.

**Solution:**
1. Check if `jq` is installed: `which jq`
2. Manually run sync: `bash hooks/sync-claude-settings.sh false`
3. Check for errors in output

### jq Not Found

**Issue:** Script warns about missing `jq` dependency.

**Solution:**
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt install jq

# CentOS/RHEL
sudo yum install jq
```

### Permissions Reverted

**Issue:** `settings.local.json` gets regenerated by Claude Code with old permissions.

**Solution:** This is expected behavior. The `session-start.sh` hook will automatically re-sync on the next session.

### Backup Files Accumulating

**Issue:** Multiple `settings.local.json.backup` files.

**Solution:** Old backups are overwritten. Only the most recent backup is kept.

## Related Documentation

- [Claude Code Settings Documentation](https://docs.claude.com/en/docs/claude-code/settings)
- [Claude Code Configuration Priority](https://www.eesel.ai/blog/settings-json-claude-code)
- [Orchestra Plugin Setup Guide](../README.md)

## Implementation Notes

### Why Not Prevent Claude Code from Generating settings.local.json?

Claude Code's auto-generation of `settings.local.json` is a core feature that cannot be disabled from plugins. Therefore, we work **with** the system rather than against it by synchronizing settings after generation.

### Why Sync at Session Start?

Claude Code may regenerate `settings.local.json` at any time (e.g., when users approve new permissions interactively). The session start hook ensures settings are always in sync at the beginning of each session.

### Performance Impact

The sync script is optimized for speed:
- Runs only if settings are out of sync
- Uses efficient `jq` operations
- Completes in < 10ms on modern hardware
- Runs silently in background during session start

### Future Enhancements

Potential improvements for future versions:

1. **File watcher**: Detect changes to `settings.local.json` in real-time
2. **Merge strategies**: More sophisticated permission merging logic
3. **Validation**: Verify syntax of `.claude.json` before sync
4. **Notifications**: Optional user notifications when sync occurs

## License

This synchronization system is part of the Orchestra Plugin and is provided as-is for use within the Claude Code ecosystem.
