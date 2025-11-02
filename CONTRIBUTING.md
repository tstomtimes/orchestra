# Contributing to Orchestra Plugin

Thank you for your interest in contributing to Orchestra Plugin! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/orchestra-plugin.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes thoroughly
6. Commit your changes: `git commit -m "Add: your feature description"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Open a Pull Request

## Development Guidelines

### Code Style

- Use clear, descriptive names for agents, skills, and policies
- Follow YAML formatting conventions for skill and policy files
- Keep agent prompts concise and focused on specific responsibilities
- Document any new environment variables in `.env.example`

### Agent Development

When creating or modifying agents:
- Each agent should have a clear, specific role
- Define expertise areas and responsibilities explicitly
- Include collaboration patterns with other agents
- Follow the existing agent structure in `orchestra-plugin/agents/`

### Skill Development

For new skills:
- Place core skills in `orchestra-plugin/skills/core/`
- Place mode-specific skills in `orchestra-plugin/skills/modes/`
- Update `policies/skills-map.yaml` to define when skills are invoked
- Ensure skills are stack-agnostic when possible

### Testing

- Test your changes with various task types
- Verify integration with existing agents and skills
- Ensure hooks execute correctly
- Check that evidence artifacts are generated properly

## Pull Request Guidelines

### PR Title Format

Use conventional commit prefixes:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Test additions or changes
- `chore:` - Maintenance tasks

### PR Description

Include:
- Clear description of changes
- Motivation and context
- Related issues (if applicable)
- Testing performed
- Breaking changes (if any)

### Example PR Description

```
## Summary
Add new agent "Maya" for machine learning tasks

## Motivation
Enables ML model development and deployment workflows

## Changes
- Added Maya agent definition in agents/maya.md
- Created ML-specific skills in skills/modes/ml.yaml
- Updated skills-map.yaml to include ML triggers

## Testing
- Tested with model training task
- Verified integration with Alex (PM)
- Checked artifact generation

## Breaking Changes
None
```

## Issue Guidelines

### Bug Reports

Include:
- Clear description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, Claude Code version, etc.)

### Feature Requests

Include:
- Clear description of the feature
- Use case and motivation
- Proposed implementation (if applicable)
- Alternatives considered

## Types of Contributions

We welcome:
- **New Agents**: Specialized agents for specific domains
- **New Skills**: Reusable capabilities for common tasks
- **Policy Improvements**: Better agent coordination rules
- **Hook Enhancements**: Improved quality gates
- **Documentation**: Better guides, examples, and explanations
- **Bug Fixes**: Issue resolutions
- **Examples**: Real-world usage examples

## Project-Specific Notes

### MCP Integration

When adding new service integrations:
- Add configuration to `mcp.json`
- Document required tokens in README
- Use least-privilege scopes
- Add example to `.env.example`

### Quality Gates

When modifying hooks:
- Ensure backward compatibility
- Test with CI/CD pipelines
- Document any new dependencies
- Keep execution time reasonable

## Questions?

If you have questions:
- Open a GitHub Discussion
- Create an issue with the `question` label
- Check existing documentation first

## Code of Conduct

Be respectful, inclusive, and collaborative. We aim to maintain a welcoming environment for all contributors.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
