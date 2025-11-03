# Agent Progress Tracking - User Guide

**Version:** 2.0.0
**Last Updated:** 2025-11-04
**Status:** Production Ready

---

## Introduction

The Orchestra Plugin includes an automatic progress tracking system that monitors agent activity during your coding sessions. This system provides real-time visibility into what your agents are doing, how far along they are, and how much time tasks are taking.

### What This Guide Covers

This guide is for **Orchestra Plugin users** who want to understand and leverage the progress tracking features during their development workflow.

### Who Should Read This

- Developers using the Orchestra Plugin with Claude Code
- Project managers monitoring multi-agent development sessions
- Anyone who wants visibility into agent task progress

### Prerequisites

- Orchestra Plugin installed and configured
- Claude Code CLI running
- TodoWrite tool enabled (automatically available with Claude Code)

---

## How It Works (The Basics)

The progress tracker is **completely automatic**. You don't need to do anything to enable it—it just works.

### Automatic Operation

1. When an agent uses the TodoWrite tool to track tasks, the progress system automatically captures:
   - Which agent is working
   - What task they're doing
   - How long it's taking
   - Progress percentage

2. After each TodoWrite update, you'll see a progress summary displayed in your chat

3. All progress data is stored in `.orchestra/cache/progress.json` for persistence

**Bottom Line:** Install Orchestra Plugin, start working, and progress tracking happens automatically.

---

## Understanding the Progress Display

After TodoWrite updates, you'll see a compact progress summary in your chat:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 PROGRESS  |  2 agent(s)  |  67% complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

😐 Skye   [▓▓▓▓▓▓▓░░░] 70%  Implementing authentication middleware (3m 42s)
😄 Nova   [▓▓▓▓▓░░░░░] 50%  Designing dashboard UI components (5m 12s)

✅ 8  ⚡ 3  ⏳ 4
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Reading the Display

**Header Section:**
- `🎯 PROGRESS` - Progress tracking indicator
- `2 agent(s)` - Number of agents currently active
- `67% complete` - Overall completion percentage across all tasks

**Active Agent Lines:**
- `😐 Skye` - Agent emoji and name
- `[▓▓▓▓▓▓▓░░░]` - Visual progress bar (filled = completed, empty = remaining)
- `70%` - Numeric progress percentage
- `Implementing authentication middleware` - Current task description
- `(3m 42s)` - Elapsed time for this task

**Summary Line:**
- `✅ 8` - 8 tasks completed
- `⚡ 3` - 3 tasks currently in progress
- `⏳ 4` - 4 tasks pending (not yet started)

### Agent Emoji Reference

Each agent has a unique emoji identifier:

| Agent | Emoji | Role |
|-------|-------|------|
| Alex | 😊 | System Architect |
| Blake | 😎 | DevOps & Infrastructure |
| Eden | 📚 | Documentation Lead |
| Finn | 🔍 | QA & Testing |
| Iris | 🎨 | UI/UX Designer |
| Kai | 🧠 | Architect & Design |
| Leo | 🧪 | Testing Specialist |
| Mina | 🔐 | Security Expert |
| Nova | ⚡ | Frontend Developer |
| Riley | 🌊 | Backend Developer |
| Skye | 😐 | Full-Stack Implementation |
| Theo | 🚀 | Deployment & Operations |

---

## Detailed Progress View (Verbose Mode)

For more comprehensive information, enable verbose mode:

### Option 1: Environment Variable (Session-Wide)

```bash
export ORCHESTRA_PROGRESS_VERBOSE=1
```

This enables detailed progress displays for your entire session.

### Option 2: One-Time Display

```bash
# View detailed progress on demand
ORCHESTRA_PROGRESS_VERBOSE=1 bash hooks/progress-tracker-display.sh
```

### What Verbose Mode Shows

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 ORCHESTRA PROGRESS TRACKER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Session: 1h 23m  |  Overall: [▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░] 67% (10/15 tasks)

👥 Active Agents (2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

😐 Skye
   Task: Implementing authentication middleware
   Progress: [▓▓▓▓▓▓▓░░░] 70%  (Step 7/10)
   Duration: 3m 42s
   Tags: backend, security, auth

😄 Nova
   Task: Designing dashboard UI components
   Progress: [▓▓▓▓▓░░░░░] 50%  (Step 5/10)
   Duration: 5m 12s
   Tags: frontend, ui, react

📋 Task Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Completed (8 tasks)
   - Setup project structure
   - Configure database schema
   - Design API endpoints
   - Implement user model
   - Create login endpoint

⚡ In Progress (2 tasks)
   - Implementing authentication middleware (Skye)
   - Designing dashboard UI components (Nova)

⏳ Pending (5 tasks)
   - Code review and refactoring
   - Update documentation
   - Write integration tests
   - Performance optimization
   - Production deployment

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## External Monitoring (Always-Visible Progress)

Since progress displays in chat scroll out of view, you can monitor progress continuously in a separate terminal window.

### Why Use External Monitoring?

- **Always visible** - Progress never scrolls away
- **Real-time updates** - See changes immediately
- **No interruption** - Monitor while working in Claude Code
- **Training/demos** - Great for showing progress to others

### Setup: Option 1 - Watch Command (Recommended)

Open a second terminal window and run:

```bash
watch -n 1 cat .orchestra/cache/progress-status.txt
```

**What this does:**
- Updates every 1 second (`-n 1`)
- Shows current progress status
- Refreshes automatically

**To stop:** Press `Ctrl+C`

### Setup: Option 2 - Tail Command

```bash
tail -f .orchestra/cache/progress-status.txt
```

**What this does:**
- Shows progress status
- Updates immediately when file changes
- Lower CPU usage than watch

**To stop:** Press `Ctrl+C`

### Setup: Option 3 - iTerm2 Status Bar (macOS Only)

If you use iTerm2, you can add progress to your status bar:

1. Go to **iTerm2 → Preferences → Profiles → Session**
2. Enable **Status bar enabled**
3. Click **Configure Status Bar**
4. Add a **Shell Command** component
5. Set command to:
   ```bash
   cat /full/path/to/your/project/.orchestra/cache/progress-status.txt | head -1
   ```
6. Set update frequency to 1 second

### Monitoring Large Screens / Multiple Projects

Use tmux or split terminal windows to monitor multiple projects:

```bash
# Terminal layout example
┌─────────────────────┬─────────────────────┐
│                     │  Progress Monitor   │
│   Claude Code       │  (watch -n 1 ...)   │
│   Main Window       │                     │
│                     │  Updates live       │
│                     │                     │
└─────────────────────┴─────────────────────┘
```

---

## Troubleshooting

### Progress Not Displaying

**Symptom:** No progress output after TodoWrite executions

**Possible Causes & Solutions:**

1. **TodoWrite not being used**
   - Progress tracking only works when agents use the TodoWrite tool
   - Ask your agent to create a task list if working on multi-step features

2. **jq not installed**
   ```bash
   # Check if jq is available
   which jq

   # Install on macOS
   brew install jq

   # Install on Ubuntu/Debian
   sudo apt-get install jq
   ```

3. **Progress file missing**
   ```bash
   # Check if progress file exists
   ls -la .orchestra/cache/progress.json

   # Reinitialize if missing
   bash hooks/lib/progress-migrate.sh
   ```

4. **Hook not registered**
   ```bash
   # Verify hook is registered
   grep -r "progress-tracker-display" .claude/hooks.json
   ```

### Progress Shows "Unknown" Agent

**Symptom:** Agent name appears as "Unknown" instead of actual agent name

**Why This Happens:**
- Agent detection uses heuristics based on task descriptions
- If task descriptions don't mention agent names, detection may fail

**Not a Critical Issue:**
- Progress tracking still works
- Functionality is not impaired
- Only the agent name display is affected

**How to Improve Detection:**
- When creating tasks manually, include agent name in brackets: `[Skye] Implement feature`
- Or in parentheses: `Implement feature (Skye)`

### External Monitoring Shows Stale Data

**Symptom:** `watch` or `tail` shows old progress information

**Solutions:**

1. **Check if file is being updated**
   ```bash
   # Watch file modification time
   watch -n 1 ls -l .orchestra/cache/progress-status.txt
   ```

2. **Verify export script runs**
   ```bash
   # Manually run export
   bash hooks/progress-tracker-export.sh
   ```

3. **Check hook execution**
   ```bash
   # Enable debug mode
   export ORCHESTRA_DEBUG=1
   ```

### File Lock Warning Messages

**Symptom:** Warning messages about lock acquisition failures

**Example:**
```
Warning: Could not acquire progress lock after 5 seconds
```

**What This Means:**
- Multiple agents trying to update progress simultaneously
- Lock timeout mechanism prevents indefinite waits
- This is a safety feature, not an error

**Usually Not a Problem:**
- Progress will be updated on next TodoWrite execution
- No data loss occurs

**If Frequent:**
- May indicate very high concurrent agent activity
- Consider increasing lock timeout (advanced users only)

### Slow Performance with Many Tasks

**Symptom:** Noticeable delay when displaying progress (> 100 tasks)

**Expected Behavior:**
- Performance degrades with 100+ tasks
- This is a known limitation (see OPERATIONS guide)

**Workarounds:**
1. Archive completed tasks periodically
2. Use compact mode (default) instead of verbose mode
3. Consider splitting large projects into multiple sessions

**To Archive Old Tasks:**
```bash
# Backup current progress
cp .orchestra/cache/progress.json .orchestra/cache/progress-backup.json

# Reset for new session
bash hooks/lib/progress-migrate.sh
```

---

## Frequently Asked Questions (FAQ)

### Q: Do I need to configure anything?

**A:** No. Progress tracking is automatic once Orchestra Plugin is installed. No configuration required.

### Q: Can I disable progress tracking?

**A:** Yes, though not recommended. To disable:
```bash
# Temporarily disable for current session
export ORCHESTRA_PROGRESS_DISABLE=1

# Or remove the hook registration from .claude/hooks.json
```

### Q: Does this consume additional tokens?

**A:** No. Progress tracking happens in bash hooks after tool execution. It does not consume Claude API tokens.

### Q: Can I see yesterday's progress?

**A:** Progress is session-based. When you start a new session, progress resets. To preserve history:
```bash
# Before starting new session, backup progress
cp .orchestra/cache/progress.json .orchestra/cache/progress-$(date +%Y%m%d-%H%M%S).json
```

### Q: Why does progress percentage sometimes jump?

**A:** Progress is calculated based on:
- Step completion (if agent provides step info)
- Task completion ratio
- Agent estimates (may vary)

This is normal behavior as agents refine their task estimates.

### Q: Can multiple agents work simultaneously?

**A:** Yes! The system supports concurrent agent execution and tracks each agent independently. You'll see all active agents in the progress display.

### Q: What happens if I interrupt a task?

**A:** Tasks remain in "in_progress" state until explicitly completed or a new session starts. You can manually reset progress if needed (see Operations guide).

### Q: Does this work on Windows?

**A:** The system is designed for Unix-like environments (macOS, Linux). Windows users should use WSL (Windows Subsystem for Linux) for full compatibility.

### Q: Can I export progress to other formats?

**A:** Currently, progress is available in:
- Chat display (automatic)
- Text file (`.orchestra/cache/progress-status.txt`)
- JSON file (`.orchestra/cache/progress.json`)

For other formats (CSV, HTML), see the Operations guide for advanced export options.

---

## Advanced Usage

### Training Mode (Maximum Detail)

Enable all debugging output for training or troubleshooting:

```bash
export ORCHESTRA_PROGRESS_VERBOSE=1
export ORCHESTRA_DEBUG=1
```

This shows:
- Detailed progress information
- Agent detection logs
- File operation logs
- Timing information

**Warning:** Generates significant log output. Use only when needed.

### Custom Progress Display

You can manually invoke the display script at any time:

```bash
# Compact view
bash hooks/progress-tracker-display.sh

# Verbose view
bash hooks/progress-tracker-display.sh --verbose
```

### Inspecting Raw Progress Data

Progress data is stored in JSON format:

```bash
# View raw progress data
cat .orchestra/cache/progress.json | jq .

# Query specific information
jq '.metadata.activeAgents' .orchestra/cache/progress.json
jq '.todos[] | select(.status == "in_progress")' .orchestra/cache/progress.json
```

### Integration with Other Tools

Progress data can be integrated with external monitoring tools:

**Example: Push to Slack**
```bash
# Simple webhook integration (add to hooks/post_code_write.sh)
if [ -f .orchestra/cache/progress-status.txt ]; then
    progress=$(head -3 .orchestra/cache/progress-status.txt)
    curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
         -H 'Content-Type: application/json' \
         -d "{\"text\": \"$progress\"}"
fi
```

**Example: Log to File**
```bash
# Append progress snapshots to timestamped log
echo "$(date): $(cat .orchestra/cache/progress-status.txt)" >> .orchestra/logs/progress-history.log
```

---

## Tips for Best Experience

### 1. Use TodoWrite Consistently

Progress tracking relies on the TodoWrite tool. For best results:
- Break complex tasks into subtasks
- Use TodoWrite to track multi-step features
- Update task status as work progresses

### 2. Monitor in a Second Terminal

Set up external monitoring at the start of your session:
```bash
watch -n 1 cat .orchestra/cache/progress-status.txt
```

### 3. Archive Progress for Important Sessions

Before major milestones, save progress snapshots:
```bash
cp .orchestra/cache/progress.json .orchestra/archive/release-1.0-progress.json
```

### 4. Review Progress Regularly

Use verbose mode to understand agent activity patterns:
```bash
ORCHESTRA_PROGRESS_VERBOSE=1 bash hooks/progress-tracker-display.sh
```

### 5. Combine with Git Commits

Link progress milestones to git commits:
```bash
# After major completion, commit with progress context
git add .
git commit -m "Implement auth system

Progress: 10 tasks completed in 1h 23m
Agents: Skye (backend), Nova (frontend), Leo (tests)"
```

---

## Next Steps

- **For Operations:** See [AGENT-PROGRESS-TRACKING-OPERATIONS.md](./AGENT-PROGRESS-TRACKING-OPERATIONS.md)
- **For Architecture:** See [docs/architecture/ADR-001-enhanced-progress-tracking-system.md](./architecture/ADR-001-enhanced-progress-tracking-system.md)
- **For Implementation:** See [docs/architecture/PROGRESS-TRACKING-IMPLEMENTATION-GUIDE.md](./architecture/PROGRESS-TRACKING-IMPLEMENTATION-GUIDE.md)

---

## Getting Help

**Issues or Questions:**
- Check this guide's Troubleshooting section
- Review logs in `.orchestra/logs/progress-tracker.log`
- Consult the Operations guide for advanced diagnostics

**Bug Reports:**
- File issues at the Orchestra Plugin repository
- Include progress.json contents (sanitize sensitive data)
- Provide steps to reproduce

---

**Document Version:** 1.0
**Author:** Eden (Documentation Lead)
**Review Date:** 2025-11-04
**Next Review:** After user feedback collection
