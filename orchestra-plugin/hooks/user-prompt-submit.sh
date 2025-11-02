#!/usr/bin/env bash
# Auto-approve Hook with Safety Guards
# Automatically approves all tool uses EXCEPT dangerous operations
#
# This hook enables autonomous operation while preventing destructive actions

set -euo pipefail

# Get the tool use details from environment
TOOL_NAME="${TOOL_NAME:-}"
TOOL_PARAMS="${TOOL_PARAMS:-}"

# List of dangerous operations to block
DANGEROUS_PATTERNS=(
    # File deletion
    "rm -rf /"
    "rm -rf ~"
    "rm -rf \*"
    "rm -rf ."
    "sudo rm -rf"

    # Disk operations
    "dd if="
    "mkfs"
    "fdisk"

    # System modifications
    "sudo shutdown"
    "sudo reboot"
    "sudo halt"
    "sudo poweroff"

    # Package manager dangerous operations
    "sudo apt-get remove"
    "sudo apt remove"
    "sudo yum remove"
    "brew uninstall"

    # Git destructive operations
    "git push --force"
    "git push -f"
    "git reset --hard HEAD~"

    # Database drops
    "DROP DATABASE"
    "DROP TABLE"

    # Permission changes
    "chmod 777"
    "chmod -R 777"
)

# Check if this is a Bash tool use
if [ "$TOOL_NAME" = "Bash" ]; then
    # Extract the command from TOOL_PARAMS
    COMMAND=$(echo "$TOOL_PARAMS" | jq -r '.command // empty' 2>/dev/null || echo "")

    if [ -n "$COMMAND" ]; then
        # Check against dangerous patterns
        for pattern in "${DANGEROUS_PATTERNS[@]}"; do
            if echo "$COMMAND" | grep -qF "$pattern"; then
                # Block dangerous command
                echo "🛑 BLOCKED: Dangerous command detected: $pattern"
                echo "Command: $COMMAND"
                echo ""
                echo "This command has been blocked for safety."
                echo "If you need to run this, please do it manually."
                exit 1
            fi
        done

        # Additional checks for rm with recursive flag
        if echo "$COMMAND" | grep -qE "rm\s+.*-[rf].*\s*/"; then
            echo "🛑 BLOCKED: Potentially dangerous rm command with root path"
            echo "Command: $COMMAND"
            exit 1
        fi

        # Check for rm of important directories
        if echo "$COMMAND" | grep -qE "rm\s+.*-[rf].*\s+(bin|usr|etc|var|lib|boot|sys|proc|dev|home)"; then
            echo "🛑 BLOCKED: Attempting to delete system directory"
            echo "Command: $COMMAND"
            exit 1
        fi
    fi
fi

# Check for Edit/Write operations on critical system files
if [ "$TOOL_NAME" = "Edit" ] || [ "$TOOL_NAME" = "Write" ]; then
    FILE_PATH=$(echo "$TOOL_PARAMS" | jq -r '.file_path // empty' 2>/dev/null || echo "")

    if [ -n "$FILE_PATH" ]; then
        # Block modifications to critical system files
        CRITICAL_PATHS=(
            "/etc/passwd"
            "/etc/shadow"
            "/etc/sudoers"
            "/etc/hosts"
            "/boot/"
            "/sys/"
            "/proc/"
        )

        for path in "${CRITICAL_PATHS[@]}"; do
            if echo "$FILE_PATH" | grep -qF "$path"; then
                echo "🛑 BLOCKED: Attempting to modify critical system file"
                echo "File: $FILE_PATH"
                exit 1
            fi
        done
    fi
fi

# Auto-approve all other operations
# No output means approval (hook succeeds)
exit 0
