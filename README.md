# Orchestra Plugin for Claude Code

Turn Claude Code into a **semi-autonomous development team** with specialized AI agents, automated quality gates, and seamless integrations.

English | [日本語](README.ja.md)

## Why Orchestra?

**Just use Claude Code as you normally would.** No new commands to learn, no complex workflows. Orchestra Plugin works quietly in the background:

- 🤖 **Multi-agent coordination** - Alex (PM), Eden (QA), Iris (Security), Mina (Frontend), Theo (DevOps) collaborate automatically
- 🛡️ **Automated quality gates** - Pre-merge checks, security scans, test validation run automatically
- 🔌 **Seamless integrations** - GitHub, Vercel, Shopify, Slack - all connected and ready
- 🌐 **Browser automation** - Built-in Playwright integration for web testing and automation
- 🎯 **Evidence-based** - Changelogs, test plans, and documentation generated automatically

**It just works.** Install once, code naturally.

## Quick Start

### 1. Clone and Configure

```bash
git clone https://github.com/tstomtimes/orchestra-plugin.git
cd orchestra-plugin
cp .env.example .env
# Edit .env with your GitHub token (required) and optional service tokens
```

### 2. Install

```bash
./setup.sh
```

That's it! The setup script installs everything automatically.

### 3. Add to Claude Code

In Claude Code settings, add this plugin:

**Option A: Using Claude Code UI**
1. Open Claude Code Settings
2. Go to "Plugins" section
3. Click "Add Plugin"
4. Select the `orchestra-plugin` directory

**Option B: Manual Configuration**
Add to your Claude Code configuration file:
```json
{
  "plugins": [
    {
      "path": "/path/to/orchestra-plugin"
    }
  ]
}
```

### 4. Start Coding

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

### Quality Gates (No Action Needed)

- **before_task.sh** - Validates task clarity
- **before_pr.sh** - Linting, type checking, tests, secret scanning
- **before_merge.sh** - E2E tests, performance checks
- **before_deploy.sh** - Environment validation, migration checks
- **after_deploy.sh** - Smoke tests, notifications

All hooks gracefully skip if tools aren't installed. No errors, no friction.

### Your Development Team - 12 Specialized Agents

**Core Team:**
- **Alex** 🎯 _"I'll bring it all together"_ - The conductor. Transforms ambiguous requests into clear tasks and routes to the right specialists
- **Riley** 🔍 _"No ambiguity allowed"_ - Requirements whisperer. Turns vague wishes into concrete acceptance criteria through expert questioning
- **Skye** ⚡ _"Keep it simple, keep it fast"_ - Implementation craftsperson. Transforms clear specs into elegant, maintainable code

**Quality & Testing:**
- **Finn** 🐛 _"If it can break, I'll find it"_ - Test automation specialist. Relentless QA engineer who never misses a bug
- **Eden** ✨ _"Quality is non-negotiable"_ - Manual testing expert. Sharp eye for edge cases and quality validation

**Architecture & Data:**
- **Kai** 🏗️ _"Everything should have a reason to exist"_ - Systems philosopher. Architect who documents every technical decision with clarity
- **Leo** 💾 _"Solid foundations build reliable systems"_ - Data guardian. Protects schema integrity and migration safety

**Security & UI:**
- **Iris** 🛡️ _"Security first, always"_ - Security professional. Vigilant guardian who spots vulnerabilities before they ship
- **Nova** ✨ _"Make it functional and beautiful"_ - UI/UX maestro. Perfectionist who never compromises on accessibility or performance
- **Mina** 🎨 _"User experience comes first"_ - Frontend magician. Creates responsive, delightful interfaces users love

**Operations:**
- **Theo** 📊 _"I'm watching the system"_ - Infrastructure watcher. Automation expert who perfects monitoring and deployment
- **Blake** 🚀 _"Everything's lined up. Let's ship!"_ - Release conductor. Ensures every deployment is safe and confident

All agents work together automatically to give you the best development experience.

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
orchestra-plugin/
├── agents/           # AI agents (Alex, Eden, Iris, Mina, Theo)
├── skills/           # Reusable capabilities
├── hooks/            # Quality gate scripts
├── mcp-servers/      # Service integrations
└── .claude/          # Claude Code commands
```

## Advanced Usage

### Custom Slash Commands

Available commands in [.claude/commands/](.claude/commands/):
- `/browser` - Start/restart browser automation server

### MCP Server Integrations

All servers are pre-configured and ready to use:

- **GitHub** - PR management, issue tracking
- **Vercel** - Deployment automation
- **Shopify** - Theme development
- **Slack** - Team notifications
- **Browser** - Web automation, screenshots, testing

No manual setup needed. Just add tokens to `.env`.

### Hook Customization

Hooks are in [hooks/](orchestra-plugin/hooks/) and fully customizable. Each hook:
- Auto-detects your project type
- Skips gracefully if tools aren't available
- Provides clear error messages
- Supports multiple frameworks

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

## Support

- 📖 [Full Documentation](orchestra-plugin/)
- 🐛 [Report Issues](https://github.com/tstomtimes/orchestra-plugin/issues)
- 💬 [Discussions](https://github.com/tstomtimes/orchestra-plugin/discussions)

---

**Built for Claude Code** - Making AI-assisted development more powerful, autonomous, and delightful.
