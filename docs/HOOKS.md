# Orchestra Plugin - Hook System Architecture

This document explains the comprehensive hook system that powers Orchestra Plugin's automated quality gates and agent routing.

## Overview

Orchestra Plugin uses Claude Code's hook system to provide:
- **Automatic agent routing** based on prompt analysis
- **Safety guards** to prevent destructive operations
- **Quality gates** for PR, merge, and deployment workflows
- **Task clarity reminders** to ensure well-defined requirements

## Automatic Activation

**Good news: Hooks activate automatically when you install the plugin!**

### Installation Process

1. Install the plugin:
   ```
   /plugin marketplace add /path/to/orchestra
   /plugin install orchestra
   ```

2. Restart Claude Code

3. Hooks are now active! ✅

No additional configuration needed.

## Hook Configuration

All hooks are defined in `hooks/hooks.json` and are automatically loaded when the Orchestra Plugin is enabled.

## Hook Files

All hook scripts are located in the `hooks/` directory:

```
hooks/
├── hooks.json                        # Hook configuration (loaded by Claude Code)
├── agent-routing-reminder.sh         # Agent auto-routing (6.7K)
├── user-prompt-submit.sh             # Safety guard (3.3K)
├── before_task.sh                    # Task clarity reminder (2.3K)
├── workflow-dispatcher.sh            # Workflow routing (2.0K)
├── workflow-post-dispatcher.sh       # Post-workflow validation (1.6K)
├── before_pr.sh                      # Pre-PR quality gates (2.5K)
├── before_merge.sh                   # Pre-merge quality gates (2.3K)
├── before_deploy.sh                  # Pre-deploy validation (3.7K)
└── after_deploy.sh                   # Post-deploy smoke tests (5.2K)
```

## Hook Types and Workflow

### 1. UserPromptSubmit Hooks

**Trigger:** When a user submits any prompt to Claude Code

**Active Hooks:**

#### agent-routing-reminder.sh
- **Purpose:** Analyzes user prompts for keywords and suggests appropriate specialist agents
- **Triggers:**
  - Ambiguous language (fast, slow, better, etc.) → Riley
  - UI/UX work (dashboard, component, form, etc.) → Nova
  - Database work (table, schema, migration, etc.) → Leo
  - External integrations (Stripe, OAuth, API, etc.) → Mina
  - Architecture decisions (refactor, design pattern, etc.) → Kai
  - Security concerns (auth, secrets, vulnerability, etc.) → Iris

**Example:**
```
You: "Make the dashboard load faster"

🎭 AGENT AUTO-ROUTING REMINDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  CRITICAL: Detected specialized domain in user request.

📋 Matched Agents: Riley Nova

🚨 MANDATORY ACTION REQUIRED:

   • Riley (Clarifier): User request contains ambiguous/subjective language
     → IMMEDIATELY invoke: orchestra:🧐 Riley
     → Reason: Terms like 'fast', 'slow', 'better' require specific criteria

   • Nova (UI/UX Specialist): User interface work detected
     → IMMEDIATELY invoke: orchestra:😄 Nova
     → Reason: UI/UX requires accessibility, performance, and design expertise
```

#### before_task.sh
- **Purpose:** Reminds users about task clarity best practices
- **Checks:**
  - Detects subjective/ambiguous language
  - Validates task definition file (`.claude/current-task.md`)
  - Suggests Riley agent for ambiguous requirements
- **Non-blocking:** Always approves, provides informational output only

### 2. PreToolUse Hooks

**Trigger:** Before any tool executes

**Active Hooks:**

#### user-prompt-submit.sh (Safety Guard)
- **Matcher:** All tools (`*`)
- **Purpose:** Blocks dangerous operations
- **Blocks:**
  - Destructive file operations (`rm -rf /`, system directory deletion)
  - Disk operations (`dd`, `mkfs`, `fdisk`)
  - System modifications (`shutdown`, `reboot`, package removal)
  - Forced git operations (`push --force` to main/master)
  - Critical file modifications (`/etc/passwd`, `/etc/sudoers`, etc.)
  - Dangerous permissions (`chmod 777`)

**Example:**
```bash
# This will be blocked:
rm -rf /

# Output:
🛑 BLOCKED: Dangerous command detected: rm -rf /
Command: rm -rf /

This command has been blocked for safety.
If you need to run this, please do it manually.
```

#### workflow-dispatcher.sh
- **Matcher:** Bash tool only
- **Purpose:** Routes workflow commands to appropriate quality gates
- **Routing Rules:**
  - `gh pr create` → `before_pr.sh` (lint, type check, tests, security)
  - `git merge` → `before_merge.sh` (E2E tests, Lighthouse)
  - `deploy` / `git push production` → `before_deploy.sh` (env validation, migrations)

**Example:**
```
You: "Create a pull request for this feature"

📋 Pre-PR Quality Checks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→ Running ESLint...
✅ ESLint passed

→ Running TypeScript compiler...
✅ TypeScript compilation successful

→ Running tests...
✅ All tests passed

✅ Pre-PR checks passed
```

### 3. PostToolUse Hooks

**Trigger:** After tool execution completes

**Active Hooks:**

#### workflow-post-dispatcher.sh
- **Matcher:** Bash tool only
- **Purpose:** Post-workflow validation
- **Routing Rules:**
  - Deploy commands → `after_deploy.sh` (smoke tests, health checks)
- **Non-blocking:** Warns on failure but doesn't block (deployment already happened)

### 4. SessionStart Hooks

**Trigger:** When Claude Code session starts

**Active Hooks:**
- Displays welcome message: "🎭 Orchestra Plugin loaded - Specialized agents ready for coordination"

## Workflow Quality Gates

These scripts are called by the dispatcher hooks when specific commands are detected:

### before_pr.sh
**Triggered by:** `gh pr create`, `hub pull-request`

**Checks:**
- ESLint (JavaScript/TypeScript projects)
- TypeScript compilation (`tsc --noEmit`)
- Test suite execution
- Secret scanning (gitleaks)
- SBOM generation (syft)

**Result:** Blocks PR creation if checks fail

### before_merge.sh
**Triggered by:** `git merge`

**Checks:**
- Playwright E2E tests
- Lighthouse CI (performance, accessibility, SEO)
- Integration tests

**Result:** Blocks merge if checks fail

### before_deploy.sh
**Triggered by:** `deploy`, `vercel`, `netlify`, `git push production`

**Checks:**
- Required environment variables
- Database migration dry-run
- Build artifacts validation
- Health check endpoints

**Result:** Blocks deployment if checks fail

### after_deploy.sh
**Triggered by:** After deployment commands

**Checks:**
- Smoke tests (health endpoint, authentication, critical paths)
- Rollback readiness verification
- Monitoring alert validation
- Documentation updates

**Result:** Warns on failure but doesn't block (deployment already completed)

## Hook Input Format

All hooks receive JSON input via stdin with this structure:

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/current/working/directory",
  "permission_mode": "default",
  "hook_event_name": "UserPromptSubmit",
  "prompt": "User's prompt text",          // UserPromptSubmit only
  "tool_name": "Bash",                     // PreToolUse/PostToolUse only
  "tool_input": {                          // PreToolUse/PostToolUse only
    "command": "gh pr create"
  },
  "tool_output": "Tool execution result"   // PostToolUse only
}
```

## Hook Output Behavior

- **Exit code 0:** Hook approves, continue execution
- **Exit code 1:** Hook blocks, prevents tool execution (PreToolUse only)
- **stdout:** For UserPromptSubmit, added to Claude's context as additional information
- **stdout:** For other hooks, displayed to user in transcript

## Graceful Degradation

All workflow hooks gracefully skip checks if required tools aren't installed:

```bash
if command -v eslint &> /dev/null; then
  # Run ESLint
else
  echo "⚠️ ESLint not found. Skipping lint checks."
fi
```

**Result:** No errors, no friction. Hooks only run checks for tools that are available.

## Extension Points

### Adding New Quality Gates

1. Create a new script in `hooks/` (e.g., `before_release.sh`)
2. Make it executable: `chmod +x hooks/before_release.sh`
3. Add detection logic to `workflow-dispatcher.sh`:
   ```bash
   elif echo "$COMMAND" | grep -qE "gh release create"; then
       bash "$SCRIPT_DIR/before_release.sh" || exit 1
   fi
   ```

### Adding New Agent Routing Rules

Edit `hooks/agent-routing-reminder.sh` and add keyword detection:

```bash
if echo "$PROMPT_LOWER" | grep -qE "(your|keywords|here)"; then
    MATCHED_AGENTS+=("YourAgent")
    AGENT_MATCHED=true
fi
```

## Testing Hooks

Test hooks locally without Claude Code:

```bash
# Test UserPromptSubmit hook
echo '{"prompt": "Add new authentication system"}' | bash hooks/agent-routing-reminder.sh

# Test PreToolUse hook
echo '{"tool_name": "Bash", "tool_input": {"command": "rm -rf /"}}' | bash hooks/user-prompt-submit.sh

# Test workflow dispatcher
echo '{"tool_name": "Bash", "tool_input": {"command": "gh pr create"}}' | bash hooks/workflow-dispatcher.sh
```

## Debugging

Enable verbose output in any hook script:

```bash
set -x  # Add after 'set -euo pipefail'
```

View hook execution in Claude Code:
- Press `Ctrl+R` to enter transcript mode
- Hook output is visible in the transcript

## Security Considerations

1. **Hook scripts are executable code** - Review carefully before enabling
2. **stdin JSON parsing** - All hooks use `jq` for safe JSON parsing
3. **Command injection prevention** - No eval or unquoted variable expansion
4. **Fail-safe defaults** - Safety hooks block by default on suspicious patterns
5. **Audit trail** - All hook executions are logged in Claude Code transcript

## Performance

- **Agent routing:** ~50-100ms (keyword matching only)
- **Safety guard:** ~10-20ms (pattern matching only)
- **Workflow dispatcher:** ~0-5s depending on quality gates enabled
- **Total overhead per prompt:** ~100-200ms (excluding actual quality gate execution)

## Disabling Hooks

To temporarily disable hooks:

1. Disable the entire plugin:
   ```
   /plugin disable orchestra
   ```

2. Or modify `hooks/hooks.json` to comment out specific hooks

3. To permanently remove, uninstall the plugin:
   ```
   /plugin uninstall orchestra
   ```

## Related Documentation

- [Claude Code Hooks Reference](https://docs.claude.com/en/docs/claude-code/hooks)
- [Orchestra Plugin README](../README.md)
- [Security Policy](SECURITY.md)
- [Plugin Installation Guide](PLUGIN_GUIDE.md)
