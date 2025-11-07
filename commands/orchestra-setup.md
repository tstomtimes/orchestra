---
description: Run the Orchestra Plugin setup script to install all MCP servers and dependencies
---

# Orchestra Plugin Setup

Run the complete setup script to install all MCP servers, dependencies, and configure the Orchestra Plugin environment.

## Task

Execute the Orchestra setup script to install:
- Node.js dependencies (Express, Playwright, TypeScript)
- Playwright Chromium browser
- Python virtual environment and packages (elevenlabs, requests)
- Configure hooks and permissions (.claude/settings.json with auto-approve)
- Install safety guard hook (blocks dangerous operations only)
- Create necessary directories (artifacts, etc.)

## Steps

1. Check if setup.sh exists and is executable:
   ```bash
   if [ ! -f "./setup.sh" ]; then
     echo "❌ setup.sh not found. Please ensure you're in the Orchestra repository root."
     exit 1
   fi
   ```

2. Make setup.sh executable if needed:
   ```bash
   chmod +x ./setup.sh
   ```

3. Run the setup script:
   ```bash
   ./setup.sh
   ```

4. After completion, show next steps:
   ```
   ✅ Orchestra Plugin setup completed!

   Next steps:
   1. Edit .env file to add your API keys (if not done already)
   2. Restart Claude Code to activate all features
   3. Start coding - Orchestra will automatically enhance your workflow!

   Available features:
   - /browser - Start Browser MCP server
   - /screenshot - Capture web screenshots
   - 11 specialized AI agents (Riley, Skye, Finn, Eden, Kai, Leo, Iris, Nova, Mina, Theo, Blake) coordinated by main Claude Code
   - Automated quality gates (before_task, before_pr, before_merge, before_deploy, after_deploy)
   - Multi-agent orchestration with parallel execution
   ```

## Notes

- This command should be run once after cloning the Orchestra repository
- The setup script checks for prerequisites (Node.js 18+, Python 3.8+)
- All hooks automatically skip if tools aren't installed (no errors)
- Environment variables can be configured later in the .env file
- Only GITHUB_TOKEN is required; all other tokens are optional
- The script creates symlinks for hooks and slash commands
- Browser server can be started separately with `/browser` command

## Auto-Approval & Safety

The setup creates `.claude/settings.json` with:
- `"permissions.allow": ["*"]` - Auto-approve all tools (no confirmation dialogs)
- Safety guard hook (`hooks/user-prompt-submit.sh`) blocks dangerous operations:
  - `rm -rf /`, system file modifications
  - `sudo shutdown/reboot`
  - `git push --force`
  - Database drops (`DROP DATABASE/TABLE`)
  - And more...

This enables autonomous operation while preventing destructive actions.
