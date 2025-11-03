# Orchestra for Claude Code

Turn Claude Code into a **semi-autonomous development team** with specialized AI agents, automated quality gates, and seamless integrations.

English | [日本語](README.ja.md)

> 🔒 **Security**: Orchestra Plugin uses automated hooks with built-in safety guards. Dangerous operations are automatically blocked. See [docs/SECURITY.md](docs/SECURITY.md) for details.

## Why Orchestra?

**Just use Claude Code as you normally would.** No new commands to learn, no complex workflows. Orchestra Plugin works quietly in the background:

- 🤖 **Multi-agent coordination** - Alex (PM), Eden (QA), Iris (Security), Mina (Frontend), Theo (DevOps) collaborate automatically
- 📊 **Real-time progress tracking** - See which agents are working, on what, and how far along they are
- 🛡️ **Automated quality gates** - Pre-merge checks, security scans, test validation run automatically
- 🔌 **Seamless integrations** - GitHub, Vercel, Shopify, Slack - all connected and ready
- 🌐 **Browser automation** - Built-in Playwright integration for web testing and automation
- 🧠 **Memory Bank integration** - Persistent project knowledge that survives session restarts
- 🎯 **Evidence-based** - Changelogs, test plans, and documentation generated automatically

**It just works.** Install once, code naturally.

## Quick Start

### Installation

Orchestra Plugin requires MCP servers to be set up locally. Follow these steps:

#### 1. Clone and Configure

```bash
git clone https://github.com/tstomtimes/orchestra.git
cd orchestra
cp .env.example .env
# Edit .env with your GitHub token (required) and optional service tokens
```

#### 2. Run Setup Script

```bash
./setup.sh
```

This installs:
- Node.js dependencies (Express, Playwright, TypeScript)
- Playwright Chromium browser for automation
- Python virtual environment and packages (elevenlabs, requests)
- All MCP servers (Browser, GitHub, Vercel, Shopify, Slack, etc.)
- Memory Bank initialization (persistent project knowledge)
- Hooks and quality gates

Alternatively, you can run the setup from within Claude Code:

```
/orchestra-setup
```

#### 3. Install Plugin in Claude Code

In Claude Code, run:

```
/plugin marketplace add /path/to/orchestra
/plugin install orchestra
```

Replace `/path/to/orchestra` with the full path to your cloned repository.

#### 4. Restart Claude Code

Restart Claude Code to activate all features.

## Using Orchestra in Other Projects

After installing the Orchestra Plugin, **configure each project** where you want to use it:

### 1. Copy and Configure Settings

Copy the `.claude/settings.json` file from the Orchestra repository:

```bash
# In your project directory
cd /path/to/your-project

# Create .claude directory if it doesn't exist
mkdir -p .claude

# Copy Orchestra settings
cp /path/to/orchestra/.claude/settings.json .claude/settings.json
```

### 2. Update Plugin Path

**IMPORTANT:** Edit `.claude/settings.json` and update the `path` to point to your Orchestra installation:

```json
{
  "extraKnownMarketplaces": {
    "orchestra-marketplace": {
      "source": {
        "source": "directory",
        "path": "/absolute/path/to/orchestra"  ← Update this!
      }
    }
  }
}
```

Replace `/absolute/path/to/orchestra` with the full path where you cloned the Orchestra repository.

**What this enables:**
- ✅ Auto-approval for all safe tools (dangerous commands blocked by safety guard)
- ✅ Access to 12 specialized agents
- ✅ Automatic hook execution (agent routing, safety guards, quality gates)
- ✅ Slash commands (`/browser`, `/screenshot`, `/orchestra-setup`)

### 3. Restart Claude Code

Restart Claude Code to apply the configuration.

### 4. Ready to Use

All Orchestra features are now available in your project:
- ✅ 12 specialized agents (Alex, Riley, Skye, Finn, Eden, Kai, Leo, Iris, Nova, Mina, Theo, Blake)
- ✅ Automatic agent routing
- ✅ Auto-approval with safety guard (only dangerous commands blocked)
- ✅ Slash commands (`/browser`, `/screenshot`, `/orchestra-setup`)

**Important:** The plugin's hooks, agents, and commands **work automatically**. No additional files needed in your project. Just copy `.claude/settings.json` and you're done.

### Start Coding

Use Claude Code exactly as before. Orchestra Plugin enhances everything automatically:

```
You: "Add a user profile page with avatar upload"

→ Alex (PM) breaks down the task
→ Mina (Frontend) handles UI implementation
→ Eden (QA) validates quality
→ Iris (Security) checks for vulnerabilities
→ Pre-merge hooks ensure everything passes
→ Changelog and docs generated automatically
```

## Features That Work Automatically

### Memory Bank Integration

**Orchestra automatically initializes persistent project knowledge** that survives Claude Code session restarts.

**What is Memory Bank?**

Memory Bank is a persistent knowledge storage system that maintains project context across sessions. Instead of re-explaining your project every time Claude Code restarts, Memory Bank preserves:

- **Project overview and current state** - High-level context about your project
- **Technology stack and dependencies** - What technologies you're using and why
- **Important decisions and rationale** - Key technical decisions with context
- **Progress tracking and milestones** - What's been completed and what's next
- **Next steps and action items** - Immediate priorities and roadmap

**How it works:**

1. **Automatic Setup**: Running `./setup.sh` automatically initializes Memory Bank with 5 structured template files in `~/memory-bank/orchestra/`
2. **Session Persistence**: Project knowledge is preserved between Claude Code sessions
3. **Agent Access**: All Orchestra agents read and update Memory Bank files for consistent context
4. **Document Sync**: Changes in `.orchestra/specs/` automatically sync to Memory Bank
5. **Milestone Tracking**: Progress is automatically recorded after deployments and major changes

**Benefits:**

- **No more context re-explanation** - Claude remembers your project across sessions
- **Consistent agent knowledge** - All agents share the same project understanding
- **Automatic documentation** - Project knowledge is captured as you work
- **Progress visibility** - Track milestones and progress over time

**Learn more**: See [MEMORY_BANK_GUIDE.md](MEMORY_BANK_GUIDE.md) for complete documentation on using Memory Bank.

### Automated Hook System

Orchestra Plugin includes a comprehensive hook system that runs automatically:

**Active Hooks (Configured in `hooks/hooks.json`):**

1. **UserPromptSubmit Hook** - Runs when you submit any prompt
   - `agent-routing-reminder.sh` - Analyzes your request and suggests appropriate specialist agents
     - Detects keywords like "authentication", "database", "UI", "faster", etc.
     - Automatically triggers routing reminders to ensure the right agents are invoked
   - `before_task.sh` - Task clarity reminder
     - Suggests best practices for well-defined tasks
     - Checks for ambiguous language and recommends Riley agent when needed

2. **PreToolUse Hook** - Runs before any tool executes
   - `user-prompt-submit.sh` - Safety guard that blocks dangerous operations
     - Prevents destructive commands (`rm -rf`, system file modifications, etc.)
     - Ensures autonomous operation stays safe
   - `workflow-dispatcher.sh` - Routes workflow commands to quality gates
     - Detects `gh pr create` → runs `before_pr.sh` (lint, type check, tests, security scan)
     - Detects `git merge` → runs `before_merge.sh` (E2E tests, Lighthouse checks)
     - Detects deploy commands → runs `before_deploy.sh` (env validation, migration checks)

3. **PostToolUse Hook** - Runs after tool execution completes
   - `workflow-post-dispatcher.sh` - Post-workflow validation
     - Detects deploy commands → runs `after_deploy.sh` (smoke tests, health checks)

4. **SessionStart Hook** - Runs when Claude Code starts
   - Displays welcome message confirming Orchestra Plugin is loaded
   - Initializes agent coordination system

All hooks gracefully skip if tools aren't installed. No errors, no friction.

### Agent Auto-Routing (Completely Automatic)

**Orchestra automatically detects which specialist should handle your request** - you never need to manually invoke agents.

**How it works:**
- Every prompt is analyzed by the `agent-routing-reminder.sh` hook
- Keywords and patterns trigger appropriate specialist agents
- Routing reminders appear with clear guidance
- Works in **all projects** where Orchestra is enabled, not just this repo

**Example triggers:**

| You Say | Auto-Routes To | Why |
|---------|----------------|-----|
| "Make the dashboard faster" | Riley → Nova | "faster" is ambiguous; Riley clarifies, then Nova optimizes |
| "Add new authentication system" | Alex → Kai + Iris + Mina | Major feature needs coordination, architecture, security, integration |
| "Add users table to database" | Leo → Skye | Database schema design, then implementation |
| "Integrate Stripe payments" | Mina → Iris | External service integration + security audit |
| "Fix login form accessibility" | Nova | UI/UX and accessibility expertise |

**You don't need to think about which agent to use.** Just describe what you want naturally, and Orchestra routes to the right specialists automatically.

### Your Development Team - 12 Specialized Agents

**Core Team:**
- 👨‍💼 **Alex** 🎯 _"I'll bring it all together"_ - The conductor. Transforms ambiguous requests into clear tasks and routes to the right specialists
- 🧑‍🔬 **Riley** 🔍 _"No ambiguity allowed"_ - Requirements whisperer. Turns vague wishes into concrete acceptance criteria through expert questioning
- 👩‍💻 **Skye** ⚡ _"Keep it simple, keep it fast"_ - Implementation craftsperson. Transforms clear specs into elegant, maintainable code

**Quality & Testing:**
- 🤖 **Finn** 🐛 _"If it can break, I'll find it"_ - Test automation specialist. Relentless QA engineer who never misses a bug
- 👨‍🔧 **Eden** ✨ _"Quality is non-negotiable"_ - Manual testing expert. Sharp eye for edge cases and quality validation

**Architecture & Data:**
- 👨‍🏫 **Kai** 🏗️ _"Everything should have a reason to exist"_ - Systems philosopher. Architect who documents every technical decision with clarity
- 👨‍🔬 **Leo** 💾 _"Solid foundations build reliable systems"_ - Data guardian. Protects schema integrity and migration safety

**Security & UI:**
- 👮‍♀️ **Iris** 🛡️ _"Security first, always"_ - Security professional. Vigilant guardian who spots vulnerabilities before they ship
- 👩‍🎨 **Nova** ✨ _"Make it functional and beautiful"_ - UI/UX maestro. Perfectionist who never compromises on accessibility or performance
- 👩‍💻 **Mina** 🎨 _"User experience comes first"_ - Frontend magician. Creates responsive, delightful interfaces users love

**Operations:**
- 👨‍🚀 **Theo** 📊 _"I'm watching the system"_ - Infrastructure watcher. Automation expert who perfects monitoring and deployment
- 🧑‍✈️ **Blake** 🚀 _"Everything's lined up. Let's ship!"_ - Release conductor. Ensures every deployment is safe and confident

All agents work together automatically to give you the best development experience.

### Parallel Agent Execution

**Orchestra Plugin intelligently runs agents in parallel when possible**, dramatically reducing completion time while maintaining quality.

**How it works:**
- Alex (the conductor) analyzes task dependencies
- Independent tasks run concurrently in the background
- Dependent tasks execute sequentially to maintain correctness
- All results are coordinated and reviewed together

**Example parallel workflows:**

**Implementation Phase** (running in parallel):
```
User: "Add user authentication system"

Alex coordinates:
├─ Skye (Implementation) ──┐
├─ Finn (Test writing)    ──┤─→ All complete → Review together
└─ Eden (Documentation)   ──┘
```

**Review Phase** (running in parallel):
```
After implementation:

├─ Iris (Security scan)   ──┐
├─ Nova (UX review)       ──┤─→ All clear → Proceed to merge
└─ Leo (Schema validation)──┘
```

**Pre-Release Phase** (running in parallel):
```
Before deployment:

├─ Blake (Changelog)          ──┐
├─ Eden (Release notes)       ──┤─→ Ready to ship
└─ Theo (Monitoring setup)    ──┘
```

**Benefits:**
- ⚡ **3-5x faster** completion for multi-domain tasks
- 🎯 **Automatic optimization** - no manual coordination needed
- 🔒 **Safe parallelization** - dependencies are always respected
- 📊 **Full visibility** - see all agent outputs before proceeding

**Common parallel patterns:**
- Code + Tests + Docs (independent work on same feature)
- Security + UX + Performance (independent reviews)
- Frontend + Backend + Database (independent implementation layers)

The orchestration happens automatically. Just describe what you need, and Alex coordinates the most efficient execution.

### Agent Progress Tracking

**Orchestra automatically tracks and displays agent progress in real-time**, giving you complete visibility into what's happening during multi-agent sessions.

**How it works:**
- Progress tracking activates automatically when agents use TodoWrite
- After each task update, see a formatted progress summary in your chat
- Track which agents are working, what they're doing, and how long tasks are taking
- No configuration needed - it just works

**What you see:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 PROGRESS  |  2 agent(s)  |  67% complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

😐 Skye   [▓▓▓▓▓▓▓░░░] 70%  Implementing auth middleware (3m 42s)
😄 Nova   [▓▓▓▓▓░░░░░] 50%  Designing dashboard UI (5m 12s)

✅ 8  ⚡ 2  ⏳ 4
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Features:**
- **Visual progress bars** - See completion percentage at a glance
- **Time tracking** - Know how long each task is taking
- **Agent identification** - Clear emoji indicators for each agent
- **Task summaries** - Completed, in-progress, and pending counts
- **External monitoring** - Optional always-visible display in separate terminal

**Always-visible monitoring** (optional):
```bash
# In a separate terminal window
watch -n 1 cat .orchestra/cache/progress-status.txt
```

**Learn more:**
- [User Guide](docs/AGENT-PROGRESS-TRACKING-USER-GUIDE.md) - How to use progress tracking
- [Operations Guide](docs/AGENT-PROGRESS-TRACKING-OPERATIONS.md) - Advanced configuration and troubleshooting

## Environment Variables

Only **GITHUB_TOKEN** is required. Everything else is optional:

```bash
# Required
GITHUB_TOKEN=ghp_your_token_here

# Optional integrations
VERCEL_TOKEN=your_vercel_token
SHOPIFY_ADMIN_TOKEN=your_shopify_token
SANITY_TOKEN=your_sanity_token
SUPABASE_SERVICE_ROLE=your_supabase_key
SLACK_BOT_TOKEN=your_slack_bot_token
ELEVENLABS_API_KEY=your_elevenlabs_key  # For voice notifications
```

See [.env.example](.env.example) for detailed configuration options.

## Project Structure

```
orchestra/
├── agents/              # AI agents (Alex, Eden, Iris, Mina, Theo, etc.)
├── skills/              # Reusable capabilities
├── hooks/               # Quality gate scripts and auto-approve hook
├── mcp-servers/         # Service integrations (GitHub, Vercel, Browser, etc.)
├── .orchestra/          # Document-Driven Development framework
│   ├── specs/           # Requirements, architecture, data models
│   ├── scripts/         # Automation scripts (Memory Bank, sync, tests)
│   └── config.json      # Workflow configuration
└── .claude/
    └── commands/        # Slash commands (/browser, /screenshot)

~/memory-bank/orchestra/ # Persistent project knowledge (auto-created)
├── project-overview.md  # Project overview and current state
├── tech-stack.md        # Technology stack and dependencies
├── decisions.md         # Important decisions log
├── progress.md          # Detailed progress tracking
└── next-steps.md        # Immediate action items
```

## Advanced Usage

### Custom Slash Commands

Available commands in [orchestra/.claude/commands/](orchestra/.claude/commands/):
- `/browser` - Start/restart browser automation server
- `/screenshot` - Capture screenshots from browser

### MCP Server Integrations

All servers are pre-configured and ready to use:

- **GitHub** - PR management, issue tracking
- **Vercel** - Deployment automation
- **Shopify** - Theme development
- **Slack** - Team notifications
- **Browser** - Web automation, screenshots, testing

No manual setup needed. Just add tokens to `.env`.

### Hook Customization

Hooks are in [hooks/](orchestra/hooks/) and fully customizable. Each hook:
- Auto-detects your project type
- Skips gracefully if tools aren't available
- Provides clear error messages
- Supports multiple frameworks

### Autonomous Operation Mode

Orchestra Plugin includes an **auto-approve hook** that enables autonomous, long-running operations while maintaining safety:

**Features:**
- ✅ **Auto-approves all safe operations** - No permission prompts for normal tasks
- 🛡️ **Blocks dangerous commands** - Prevents destructive operations automatically
- ⚡ **Perfect for long sessions** - Claude can work autonomously for hours

**Blocked operations include:**
- File deletion of system directories (`rm -rf /`, `rm -rf ~`, etc.)
- Disk operations (`dd`, `mkfs`, `fdisk`)
- System shutdown/reboot
- Package removal
- Force push to git
- Database drops
- Dangerous permission changes (`chmod 777`)
- Modifications to critical system files (`/etc/passwd`, `/etc/sudoers`, etc.)

**Location:** [`orchestra/hooks/user-prompt-submit.sh`](orchestra/hooks/user-prompt-submit.sh)

**To disable:** Simply remove or rename the hook file.

## FAQ

**Q: Do I need to learn new commands?**
A: No. Use Claude Code exactly as before. Orchestra enhances it automatically.

**Q: What if I don't have all the API tokens?**
A: Only GITHUB_TOKEN is required. Everything else is optional and gracefully disabled if not configured.

**Q: Will hooks fail my builds?**
A: Hooks auto-detect available tools and skip checks gracefully. No unexpected failures.

**Q: Can I disable agents or hooks?**
A: Yes. Everything is configurable. See individual hook files for customization.

**Q: Does this work with my existing project?**
A: Yes. Orchestra Plugin is stack-agnostic and integrates seamlessly.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE)

## Additional Documentation

- 📘 [Memory Bank Integration Guide](MEMORY_BANK_GUIDE.md) - Complete guide to persistent project knowledge
- 📊 [Agent Progress Tracking Guide](docs/AGENT-PROGRESS-TRACKING-USER-GUIDE.md) - Real-time visibility into agent work
- 📗 [Orchestra Setup Guide](ORCHESTRA_SETUP.md) - Detailed setup instructions
- 📙 [Document-Driven Development](.orchestra/README.md) - Workflow documentation
- 📚 [Full Documentation Index](docs/README.md) - Complete documentation catalog

## Support

- 📖 [Full Documentation](orchestra/)
- 🐛 [Report Issues](https://github.com/tstomtimes/orchestra/issues)
- 💬 [Discussions](https://github.com/tstomtimes/orchestra/discussions)

---

**Built for Claude Code** - Making AI-assisted development more powerful, autonomous, and delightful.
