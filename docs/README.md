# Orchestra Plugin Documentation

Welcome to the Orchestra Plugin documentation. This directory contains comprehensive guides for using, operating, and developing with Orchestra.

## Getting Started

- **[Getting Started Guide](getting-started.md)** - Installation, configuration, and first steps
- **[Configuration Guide](configuration.md)** - Detailed configuration options
- **[Plugin Development](plugin-development.md)** - Building and extending Orchestra

## Core Features

### Agent Progress Tracking

- **[User Guide](AGENT-PROGRESS-TRACKING-USER-GUIDE.md)** - How to use progress tracking features ⭐ **Start here**
- **[Operations Guide](AGENT-PROGRESS-TRACKING-OPERATIONS.md)** - System administration and maintenance

### Hooks System

- **[Hooks Documentation](HOOKS.md)** - Pre/post hooks, triggers, and custom automation

### Integration Guides

- **[Shopify MCP Configuration](shopify-mcp-flexible-configuration-design.md)** - Shopify integration setup
- **[Claude Settings Sync](claude-settings-sync.md)** - Synchronizing Claude configurations ([日本語版](claude-settings-sync-ja.md))

## Architecture

Detailed architectural documentation for understanding system design:

- **[ADR-001: Enhanced Progress Tracking System](architecture/ADR-001-enhanced-progress-tracking-system.md)** - Complete architectural design
- **[Progress Tracking Implementation Guide](architecture/PROGRESS-TRACKING-IMPLEMENTATION-GUIDE.md)** - Implementation specifications
- **[Progress Tracking Executive Summary](architecture/PROGRESS-TRACKING-EXECUTIVE-SUMMARY.md)** - High-level overview
- **[Progress Tracking Architecture Diagram](architecture/progress-tracking-architecture-diagram.md)** - Visual system flows
- **[Progress Tracking Comparison](architecture/PROGRESS-TRACKING-COMPARISON.md)** - Alternative approaches analysis

## Security and Operations

- **[Security Guide](SECURITY.md)** - Security considerations and best practices
- **[Plugin Development Guide](PLUGIN_GUIDE.md)** - Creating Orchestra plugins

## Additional Resources

### Shopify-Specific Documentation

- **[Shopify MCP Configuration Flow](shopify-mcp-configuration-flow.md)** - Configuration workflow
- **[Shopify MCP Configuration Summary (日本語)](shopify-mcp-configuration-summary-ja.md)** - Japanese summary
- **[Shopify MCP Dev Setup](mcp-shopify-dev-setup.md)** - Development environment
- **[Shopify MCP Docs Review](SHOPIFY-MCP-DOCS-REVIEW.md)** - Documentation review

## Quick Reference

### Common Tasks

| Task | Documentation |
|------|---------------|
| Install Orchestra | [Getting Started](getting-started.md) |
| View agent progress | [Progress Tracking User Guide](AGENT-PROGRESS-TRACKING-USER-GUIDE.md) |
| Set up external monitoring | [Progress Tracking User Guide - External Monitoring](AGENT-PROGRESS-TRACKING-USER-GUIDE.md#external-monitoring-always-visible-progress) |
| Troubleshoot progress issues | [Progress Tracking Operations Guide - Troubleshooting](AGENT-PROGRESS-TRACKING-OPERATIONS.md#troubleshooting) |
| Configure hooks | [Hooks Documentation](HOOKS.md) |
| Integrate with Shopify | [Shopify MCP Configuration](shopify-mcp-flexible-configuration-design.md) |
| Security best practices | [Security Guide](SECURITY.md) |

### For Different Audiences

**End Users:**
- Start with [Getting Started](getting-started.md)
- Learn about [Progress Tracking](AGENT-PROGRESS-TRACKING-USER-GUIDE.md)
- Set up [External Monitoring](AGENT-PROGRESS-TRACKING-USER-GUIDE.md#external-monitoring-always-visible-progress)

**System Administrators:**
- Review [Operations Guide](AGENT-PROGRESS-TRACKING-OPERATIONS.md)
- Check [Security Guide](SECURITY.md)
- Configure [Hooks](HOOKS.md)

**Developers:**
- Read [Plugin Development](PLUGIN_GUIDE.md)
- Study [Architecture Documentation](architecture/)
- Review [Implementation Guide](architecture/PROGRESS-TRACKING-IMPLEMENTATION-GUIDE.md)

## Documentation Standards

### Version Information

All major documentation files include:
- Version number
- Last updated date
- Author information
- Review schedule

### Getting Help

**Issues or Questions:**
- Check relevant documentation section
- Review logs in `.orchestra/logs/`
- File issues at the Orchestra Plugin repository

**Contributing:**
- Documentation contributions welcome
- Follow existing format and style
- Include practical examples
- Test all commands before documenting

## Recent Updates

**2025-11-04:**
- Added comprehensive Agent Progress Tracking documentation
- Created User Guide and Operations Guide for progress tracking
- Documented schema v2.0 specifications
- Added troubleshooting and maintenance guides

**Previous Updates:**
See individual documentation files for detailed change history.

---

**Documentation maintained by:** Eden (Documentation Lead)
**Last index update:** 2025-11-04
