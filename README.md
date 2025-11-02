# Orchestra Plugin for Claude Code

A multi-agent orchestration layer that turns Claude Code into a semi-autonomous "orchestra" with specialized agents, skills, and quality gates.

## Features

- **Multi-Agent System**: Coordinated team of specialized agents (Alex as PM, Eden for QA, Iris for Security, Theo for monitoring, Mina for frontend)
- **Skill-Based Architecture**: Capability-first, stack-agnostic skills for various development tasks
- **Quality Gates**: Automated pre-merge and pre-deploy checks via hooks
- **MCP Integration**: Seamless integration with external services (GitHub, Vercel, Shopify, etc.)
- **Evidence-Based Development**: Automatic generation of changelogs, test plans, and documentation

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/orchestra-plugin.git
   cd orchestra-plugin
   ```

2. Configure environment variables (see [.env.example](.env.example)):
   ```bash
   cp .env.example .env
   # Edit .env with your tokens
   ```

3. In Claude Code, add the plugin and point to `.claude-plugin/manifest.json`.

## Required Environment Variables

Configure the following tokens based on the services you use:
- `GITHUB_TOKEN` - For GitHub integration (repo access, PR management)
- `VERCEL_TOKEN` - For deployment management (optional)
- `SHOPIFY_ADMIN_TOKEN` - For Shopify theme development (optional)
- `SANITY_TOKEN` - For Sanity CMS integration (optional)
- `SUPABASE_SERVICE_ROLE` - For Supabase database access (optional)
- `SLACK_BOT_TOKEN` - For Slack notifications (optional)

## Project Structure

```
orchestra-plugin/
├── agents/           # Specialized AI agents
│   ├── alex.md      # Project Manager & orchestrator
│   ├── eden.md      # QA & testing specialist
│   ├── iris.md      # Security specialist
│   ├── mina.md      # Frontend specialist
│   └── theo.md      # Monitoring & operations
├── skills/          # Reusable capabilities
│   ├── core/        # Cross-cutting skills
│   └── modes/       # Context-specific skills
├── policies/        # Agent behavior rules
│   ├── skills-map.yaml
│   └── skills-overview.yaml
├── hooks/           # Quality gate scripts
└── mcp.json         # Service configurations
```

## Getting Started

### First Run

1. Start with a small task (e.g., UI tweak or new API endpoint)
2. Let **Alex** (PM agent) route the task to appropriate specialists
3. Watch hooks enforce quality gates before merges
4. Review generated artifacts (changelogs, test plans, etc.)

### Example Usage

```
# Simple feature request
"Add a new user profile page with avatar upload"

# Alex will:
# 1. Break down the task
# 2. Route to Mina (frontend) and Eden (QA)
# 3. Trigger security review from Iris
# 4. Enforce pre-merge checks
# 5. Generate documentation
```

## Safety & Best Practices

- **Least-privilege credentials**: Use minimal required scopes for each service
- **Pre-merge gates**: Automated review checklist, QA, and security checks
- **Pre-deploy gates**: Release validation and final QA
- **Evidence artifacts**: All changes tracked with changelogs and test plans

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

For issues, questions, or contributions, please open an issue on GitHub.

## Acknowledgments

Built for Claude Code to enable semi-autonomous, multi-agent software development workflows.