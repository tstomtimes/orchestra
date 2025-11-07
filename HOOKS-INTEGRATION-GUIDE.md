# Orchestra Plugin Hooks Integration Guide

## Overview

This guide explains how to set up, configure, and use the Orchestra Plugin's hook system for Claude Code. Hooks provide automated validation, quality gates, and progress tracking throughout the development workflow.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Hook Types](#hook-types)
3. [Configuration](#configuration)
4. [Available Hooks](#available-hooks)
5. [Progress Tracking Integration](#progress-tracking-integration)
6. [Troubleshooting](#troubleshooting)

## Quick Start

### 1. Enable Hooks in Claude Code

Hooks are configured through `.claude/settings.json` in your project:

```bash
# Navigate to your Orchestra project
cd /path/to/orchestra

# Hooks are already configured if you see .claude/settings.json with hooks section
cat .claude/settings.json
```

### 2. Verify Hook Configuration

After opening the project in Claude Code, hooks should be active. You can verify by:
- Observing progress tracker output after running `TodoWrite`
- Seeing agent routing suggestions when submitting prompts
- Checking task clarity reminders before code changes

### 3. First-Time Setup (if needed)

If hooks are not active:

```bash
# The setup should already be complete, but verify .claude/settings.json exists
ls -la .claude/settings.json

# If not present, the hooks/ directory should contain all hook scripts
ls -la hooks/
```

## Hook Types

### Event-Based Hooks

Hooks trigger on these Claude Code events:

#### 1. **UserPromptSubmit** - User Input Analysis
- **Trigger**: When user submits a prompt/message
- **Purpose**: Analyze input and provide routing suggestions
- **Hooks in this event**:
  - `agent-routing-reminder.sh` - Suggests appropriate specialist agents
  - `before_task.sh` - Reminds about task clarity best practices

#### 2. **PreToolUse** - Safety & Compliance Checks
- **Trigger**: Before any tool execution (Bash, Edit, Read, etc.)
- **Purpose**: Prevent dangerous operations and ensure compliance
- **Hooks in this event**:
  - `user-prompt-submit.sh` - Safety guard for dangerous bash operations
  - `pre-tool-use-compliance-checker.sh` - Enforces agent routing rules
  - `workflow-dispatcher.sh` - Routes special commands (PR, merge, deploy)

#### 3. **PostToolUse** - Quality & Progress Tracking
- **Trigger**: After tool execution completes
- **Purpose**: Track progress and apply quality fixes
- **Hooks in this event**:
  - `workflow-post-dispatcher.sh` - Post-deployment validation
  - `post_code_write.sh` - Progress tracking update and display (after TodoWrite)

#### 4. **SessionStart** - Welcome & Context
- **Trigger**: When Claude Code session begins
- **Purpose**: Display welcome message and available agents
- **Hooks in this event**:
  - `session-start.sh` - Orchestra Plugin welcome message

## Configuration

### Hook Configuration File

Location: `.claude/settings.json`

```json
{
  "hooks": {
    "EventName": [
      {
        "matcher": "ToolPattern",
        "hooks": [
          {
            "type": "command",
            "command": "bash /path/to/script.sh",
            "description": "Hook description",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

### Configuration Components

**Event Name**:
- `UserPromptSubmit` - User input
- `PreToolUse` - Before tool execution
- `PostToolUse` - After tool execution
- `SessionStart` - Session initialization

**Matcher**:
- `"*"` - All tools/prompts
- Tool name like `"Bash"`, `"Edit"`, `"TodoWrite"`
- Pattern like `"Edit|Write"` for multiple tools

**Timeout** (optional):
- Seconds to wait before killing hook
- Default: 30 seconds
- Set to 0 for no timeout

### Modifying Hooks

To customize or add hooks:

```bash
# Edit the settings file
vim .claude/settings.json

# Add new hook entry under desired event
# Changes take effect after reloading in Claude Code
```

## Available Hooks

### 1. agent-routing-reminder.sh
**Location**: `hooks/agent-routing-reminder.sh`
**Event**: UserPromptSubmit
**Purpose**: Analyzes user prompts and suggests appropriate specialist agents

**Output**:
- Displays available agents with icons and specialties
- Suggests specific agents based on request type
- Reminds to use Task tool for coordination

**Example**:
```
🎯 Agent Suggestions for Your Task:
  😐 Skye (Code Implementer) - For well-defined implementation tasks
  🤔 Kai (System Architect) - For design and architecture questions
  🤓 Eden (Documentation Lead) - For documentation and technical writing
```

### 2. before_task.sh
**Location**: `hooks/before_task.sh`
**Event**: UserPromptSubmit
**Purpose**: Provides task clarity reminders and best practices

**Output**:
- Checklist for well-defined tasks
- Reminders about clear requirements
- Links to relevant documentation

### 3. user-prompt-submit.sh
**Location**: `hooks/user-prompt-submit.sh`
**Event**: PreToolUse
**Purpose**: Safety guard preventing dangerous bash operations

**Protections**:
- Blocks `rm -rf` on critical paths
- Prevents deletion of system files
- Warns on dangerous operations
- Allows safety-critical commands through

**Example**:
```
⚠️  WARNING: Potentially dangerous command detected
Command: rm -rf /
This command could cause system damage. Use with caution.
```

### 4. pre-tool-use-compliance-checker.sh
**Location**: `hooks/pre-tool-use-compliance-checker.sh`
**Event**: PreToolUse
**Purpose**: Ensures Task tool is used first for agent routing

**Enforcement**:
- If routing agents, Task tool must be called
- Suggests using agent-specific subagents
- Provides compliance reports

### 5. workflow-dispatcher.sh
**Location**: `hooks/workflow-dispatcher.sh`
**Event**: PreToolUse (Bash)
**Purpose**: Routes special commands to quality gates

**Routed Commands**:
- Git operations (push, pull, merge)
- PR operations (create, review, merge)
- Deployment commands
- Release operations

**Output**:
- Routes to appropriate validation hooks
- Provides pre-flight checks
- Ensures quality gates are met

### 6. workflow-post-dispatcher.sh
**Location**: `hooks/workflow-post-dispatcher.sh`
**Event**: PostToolUse (Bash)
**Purpose**: Post-workflow validation and smoke tests

**Actions**:
- Runs smoke tests after deployment
- Validates deployment success
- Generates summary reports

### 7. post_code_write.sh
**Location**: `hooks/post_code_write.sh`
**Event**: PostToolUse (TodoWrite)
**Purpose**: Progress tracking integration and display

**Actions**:
- Updates progress tracker JSON
- Displays visual progress in chat
- Runs linting/formatting if configured
- Generates progress reports

**Output Format**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 PROGRESS  |  2 agent(s)  |  50% complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 4  ⚡ 2  ⏳ 3
```

### 8. session-start.sh
**Location**: `hooks/session-start.sh`
**Event**: SessionStart
**Purpose**: Welcome and context display

**Output**:
- Orchestra Plugin welcome banner
- List of available specialist agents
- Quick start instructions
- Links to documentation

## Progress Tracking Integration

### How Progress Tracking Works

1. **Initialization**: When session starts, progress tracker is loaded from `.orchestra/cache/progress.json`

2. **Updates**: When TodoWrite is called, progress data is updated:
   ```typescript
   {
     "id": "task-1",
     "content": "Task description",
     "status": "in_progress",
     "agent": "Nova",
     "currentStep": 3,
     "totalSteps": 5
   }
   ```

3. **Display**: After TodoWrite, progress is displayed in chat via `post_code_write.sh`

4. **Persistence**: Progress data is saved to `.orchestra/cache/progress.json` for session continuity

### Progress Data Structure

```json
{
  "todos": [
    {
      "id": "1",
      "content": "Task name",
      "status": "pending|in_progress|completed",
      "activeForm": "Present continuous form",
      "agent": "AgentName",
      "startTime": 1762176233651,
      "lastUpdateTime": 1762176682799,
      "currentStep": 1,
      "totalSteps": 5,
      "tags": ["tag1", "tag2"]
    }
  ],
  "metadata": {
    "totalTasks": 8,
    "completedTasks": 2,
    "inProgressTasks": 1,
    "pendingTasks": 5,
    "completionRate": 25,
    "activeAgents": ["Nova", "Skye"]
  }
}
```

### Using Progress Tracking

Track tasks using the TodoWrite tool:

```typescript
// Mark task as in progress
TodoWrite([
  {
    content: "Implement feature X",
    status: "in_progress",
    activeForm: "Implementing feature X"
  }
])

// Update with progress
TodoWrite([
  {
    content: "Implement feature X",
    status: "in_progress",
    activeForm: "Implementing feature X",
    currentStep: 3,
    totalSteps: 5
  }
])

// Mark complete
TodoWrite([
  {
    content: "Implement feature X",
    status: "completed",
    activeForm: "Implementing feature X"
  }
])
```

### Progress Display Features

The progress tracker displays:

- **Completion Rate**: Overall percentage of completed tasks
- **Active Agents**: Agents currently working (extracted from in_progress tasks)
- **Task Summary**: Colored counts (✅ complete, ⚡ in-progress, ⏳ pending)
- **In-Progress Details**:
  - Task name and current step
  - Elapsed time since start
  - Assigned agent with emoji
  - Step progress (if defined)

## Troubleshooting

### Hooks Not Running

**Symptom**: No output from hooks, no progress display

**Solutions**:
1. Verify `.claude/settings.json` exists in project root
2. Check hook scripts are executable:
   ```bash
   ls -la hooks/*.sh
   ```
3. Reload Claude Code session (close and reopen)
4. Check for syntax errors in settings.json:
   ```bash
   jq . .claude/settings.json
   ```

### Progress Not Displaying

**Symptom**: TodoWrite completes but no progress output

**Solutions**:
1. Verify progress file exists:
   ```bash
   ls -la .orchestra/cache/progress.json
   ```
2. Check jq is available:
   ```bash
   jq --version
   ```
3. Check post_code_write.sh permissions:
   ```bash
   chmod +x hooks/post_code_write.sh
   ```
4. Enable verbose logging:
   ```bash
   bash -x hooks/post_code_write.sh
   ```

### Hook Timeout Issues

**Symptom**: Hook execution times out, blocking tool use

**Solutions**:
1. Increase timeout in `.claude/settings.json`:
   ```json
   {
     "timeout": 60
   }
   ```
2. Check for long-running operations:
   ```bash
   bash -x hooks/hook-name.sh
   ```
3. Disable problematic hook temporarily:
   ```bash
   # Comment out hook in settings.json
   ```

### Agent Routing Not Suggested

**Symptom**: No agent suggestions in chat

**Solutions**:
1. Verify `agent-routing-reminder.sh` is in hooks directory
2. Check it's executable:
   ```bash
   chmod +x hooks/agent-routing-reminder.sh
   ```
3. Submit a prompt that requires agent routing to trigger

### Safety Guard Blocking Commands

**Symptom**: Safe commands being blocked

**Solutions**:
1. Review command for similarity to dangerous patterns
2. Check `user-prompt-submit.sh` for overly restrictive rules
3. Use full paths for ambiguous commands
4. Contact project maintainers if legitimate command is blocked

## Best Practices

### 1. Keep Hooks Updated
- Review hook changes regularly
- Test hook updates before deployment
- Document custom hook additions

### 2. Monitor Progress Tracking
- Use meaningful task descriptions
- Update task status consistently
- Complete tasks before starting new ones

### 3. Leverage Agent Suggestions
- Use suggested agents for better outcomes
- Provide additional context if agent suggestion doesn't match needs
- Reference agent by name using @mention syntax

### 4. Task Clarity
- Write well-defined tasks before starting
- Include acceptance criteria
- Specify expected outcomes

### 5. Safety First
- Let safety checks run
- Review warnings carefully
- Report false positives

## Advanced Configuration

### Custom Hooks

To add custom hooks:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "bash /path/to/custom-hook.sh",
            "description": "My custom hook",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

### Hook Environment Variables

Available to hooks:
- `CLAUDE_PROJECT_DIR` - Project root directory
- `CLAUDE_TOOL_PARAMS` - Tool parameters (PostToolUse only)
- `HOME` - User home directory
- `PATH` - System PATH

### Conditional Execution

Hooks can use environment variables for conditional logic:

```bash
#!/bin/bash

if [ -n "$CLAUDE_TOOL_PARAMS" ]; then
    # PostToolUse hook - has tool parameters
    echo "Tool parameters: $CLAUDE_TOOL_PARAMS"
fi

if [ -f ".orchestra/config.json" ]; then
    # Orchestra project detected
    echo "Orchestra configuration found"
fi
```

## Performance Considerations

### Hook Execution Order

1. **UserPromptSubmit** - Runs when user submits message (no blocking)
2. **PreToolUse** - Runs before tool execution (brief, non-blocking)
3. **PostToolUse** - Runs after tool execution (non-blocking)
4. **SessionStart** - Runs once per session at startup

### Optimization Tips

1. Keep hooks fast (< 1 second preferred)
2. Avoid heavy computations in PreToolUse
3. Use caching to avoid repeated processing
4. Profile slow hooks with `time` command:
   ```bash
   time bash hooks/hook-name.sh
   ```

## Support & Resources

### Documentation
- `.orchestra/README.md` - Orchestra overview
- `.claude/hooks/` - Hook scripts with comments
- `.claude/settings.json` - Hook configuration

### Related Features
- **Progress Tracking**: `.orchestra/cache/progress.json`
- **Memory Bank**: `~/memory-bank/` project directory
- **Configuration**: `.orchestra/config.json`

### Getting Help

If hooks aren't working:
1. Check hook script error messages:
   ```bash
   bash -x hooks/hook-name.sh 2>&1 | head -20
   ```
2. Verify Claude Code version supports hooks
3. Check project-level `.claude/settings.json` syntax
4. Review hook compatibility with your shell

## Version History

### v2.0.0 (Current)
- Progress tracking integration
- Enhanced display with agent info
- Support for step-based progress
- Color-coded output
- Agent emoji indicators

### v1.0.0
- Initial hook system
- Basic agent routing
- Safety guards
- Workflow dispatchers

---

## Next Steps

1. **Verify hooks are active**: Submit a prompt and look for agent suggestions
2. **Create your first task**: Use TodoWrite to start tracking work
3. **Monitor progress**: Watch progress tracker update after each TodoWrite
4. **Customize as needed**: Add custom hooks for your workflow

Happy coding with Orchestra! 🎭
