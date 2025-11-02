# Orchestra Plugin for Claude Code

A multi-agent orchestration layer that turns Claude Code into a semi-autonomous “orchestra”.

## Install
1. Clone this repo (or copy the `orchestra-plugin/` folder).
2. Configure tokens in your environment (`GITHUB_TOKEN`, etc).
3. In Claude Code, add the plugin and point to `.claude-plugin/manifest.json`.

## Structure
- `agents/` — Alex (PM) + specialized agents.
- `skills/` — Core & Mode skills (capability-first; stack-agnostic).
- `policies/skills-map.yaml` — Who auto-invokes which skills, and when.
- `hooks/` — Quality gates (wire in your CI commands).
- `mcp.json` — Minimal, per-environment credentials.

## First Run
- Start with a small task (UI tweak or new API endpoint).
- Let **Alex** route → watch hooks block merges until gates are green.
- Evidence artifacts (e.g., `changelog.md`, `test-plan.md`) will be generated/attached.

## Safety
- Least-privilege credentials.
- Pre-merge gates: review-checklist, QA, Security.
- Pre-deploy gates: release, QA.