# Orchestra Plugin - Claude Code Configuration Guide

This document guides you in leveraging the Orchestra Plugin's specialized agents and workflow integration to maximize productivity and code quality in Claude Code.

## Table of Contents

1. [Overview](#overview)
2. [Agent-First Policy](#agent-first-policy)
3. [Specialized Agents](#specialized-agents)
4. [Agent Selection Guide](#agent-selection-guide)
5. [Workflow Integration](#workflow-integration)
6. [Best Practices](#best-practices)
7. [Advanced Usage](#advanced-usage)
8. [Common Patterns](#common-patterns)

---

## Overview

The Orchestra Plugin provides 11 specialized agents that coordinate to solve complex software engineering tasks. Each agent has specific expertise and should be invoked at the appropriate stage of your development workflow.

### When to Use Orchestra Agents

- **Complex tasks requiring multiple perspectives** → Coordinate agents
- **Unclear requirements** → Start with Riley (Requirements Clarifier)
- **Clear specifications** → Go directly to Skye (Code Implementer)
- **Security concerns** → Involve Iris (Security Auditor)
- **Architectural decisions** → Consult Kai (System Architect)
- **Before PR/merge/deploy** → Run Blake (Release Manager)

---

## Agent-First Policy

**🎯 MANDATORY PRINCIPLE: All tasks must be routed through appropriate agents.**

This Orchestra installation is configured with an **Agent-First Approach**, meaning:

### Core Rules

1. **Every Request Gets an Agent**
   - No task is too small or simple to benefit from agent expertise
   - Even single-line fixes can benefit from Skye's quality standards
   - Documentation should flow through Eden
   - Tests should involve Finn

2. **Automatic Agent Routing**
   - The system automatically detects your task type from keywords
   - System reminders will appear with agent recommendations (MANDATORY ACTION REQUIRED)
   - These are not suggestions—they are routing requirements

3. **The Agent Selection Process**
   ```
   Your Request
      ↓
   Keyword Detection (agent-routing-reminder.sh)
      ↓
   Matched Agents Identified
      ↓
   Task Tool invoked with appropriate subagent_type
      ↓
   Agent executes specialized work
      ↓
   Results reported back for coordination
   ```

### Default Fallback Chain

If no specific agent matches, the system routes to **Riley** (Requirements Clarifier) first:
- Riley ensures requirements are clear and unambiguous
- Then another agent takes the clarified requirements forward
- This prevents implementing vague or incomplete specs

### Configuration Status

✅ **Active** (as of this session):
- `orchestraConfig.agentFirstApproach = true`
- `orchestraConfig.strictRoutingMode = true`
- `orchestraConfig.requireAgentInvocationForTasks = true`
- Default fallback: Riley (Requirements Clarifier)
- All 11 agents integrated and ready

### Examples of Agent Routing

| Your Input | Detected Keywords | Routed Agent | Why |
|-----------|------------------|--------------|-----|
| "Add login feature" | auth, new feature | Riley → Alex | Likely needs clarification, then project coordination |
| "Fix the dashboard" | UI, fix | Nova | UI/UX expertise required |
| "Write a guide on deployment" | documentation | Eden | Technical writing specialist |
| "Tests are flaky" | test, failing | Finn | QA & testing expertise |
| "Deploy v1.5" | deploy, release | Blake | Release management expertise |
| "Our app is slow" | performance, optimize | Riley → Kai/Theo | Ambiguous; clarify first |

### What NOT to Do

❌ **Never:**
- Start exploring the codebase yourself for a new feature request
- Create TodoWrite and handle the task personally without agent involvement
- Use tools like AskUserQuestion before checking agent routing
- Skip agent involvement because "it seems simple"

### What TO Do

✅ **Always:**
1. Let the system detect and suggest agents
2. When you see "MANDATORY ACTION REQUIRED", invoke the suggested agent via Task tool
3. Let agents do their specialized work
4. Coordinate results between multiple agents if needed
5. Track progress using TodoWrite as agents complete their work

---

## Specialized Agents

### 😎 Blake - Release Manager

**Expertise:** Deployment coordination, release management, pipeline orchestration

**When to use:**
- Preparing releases and managing version numbers
- Coordinating deployment to staging/production
- Rolling back failed releases
- Managing hotfixes and emergency patches
- Preparing release notes and changelogs

**Example prompt:**
```
"I need to deploy v2.0.0 to production. Can you coordinate the deployment?"
```

---

### 🤓 Eden - Documentation Lead

**Expertise:** Technical writing, documentation creation, knowledge sharing

**When to use:**
- Creating or updating READMEs
- Writing operational guides and runbooks
- Generating ADRs (Architecture Decision Records)
- Creating onboarding materials
- Post-deployment documentation and handover docs

**Example prompt:**
```
"After implementing the auth system, create comprehensive documentation for the team."
```

---

### 😤 Finn - QA & Testing Specialist

**Expertise:** Test coverage, automated validation, quality assurance

**When to use:**
- Designing test strategies (unit, integration, E2E)
- Fixing flaky or failing tests
- Validating test coverage before PR/merge
- Smoke and regression testing for releases
- Performance threshold validation

**Example prompt:**
```
"Our auth tests are failing. Can you diagnose and fix them?"
```

---

### 🤨 Iris - Security Auditor

**Expertise:** Authentication, secrets, vulnerability assessment, security policies

**When to use:**
- Code touches authentication or authorization
- Integrating third-party APIs or services
- Updating dependencies with security implications
- Adding or modifying environment variables
- Before PRs involving sensitive data or external integrations

**Example prompt:**
```
"I'm integrating Stripe payments. Can you review this for security issues?"
```

---

### 🤔 Kai - System Architect

**Expertise:** Structural decisions, design patterns, ADR documentation

**When to use:**
- Features impact architecture or system design
- Multiple services/modules need coordination
- Refactoring and migration planning
- Evaluating dependency choices
- Before PRs with significant architectural changes

**Example prompt:**
```
"Should we use microservices or monolithic architecture for this feature?"
```

---

### 😌 Leo - Database Architect

**Expertise:** Schema design, migrations, RLS policies, data integrity

**When to use:**
- Creating or modifying database tables/columns
- Implementing Row-Level Security (RLS) policies
- Planning database migrations with rollback strategies
- Reconciling API-database type drift
- Designing indexes and constraints

**Example prompt:**
```
"Create a migration to add user roles and permissions to the database."
```

---

### 😊 Mina - Integration Specialist

**Expertise:** External APIs, webhooks, OAuth, cross-service data flows

**When to use:**
- Integrating third-party platforms (Stripe, Shopify, AWS, etc.)
- Configuring OAuth and webhook handling
- Managing cross-service communication
- Debugging API connection issues
- Securing and testing integrations

**Example prompt:**
```
"Help me integrate Slack notifications into our system."
```

---

### 😄 Nova - UI/UX Specialist

**Expertise:** User interfaces, accessibility, performance optimization

**When to use:**
- Implementing or reviewing UI components and forms
- Optimizing interface performance
- Ensuring ARIA compliance and accessibility
- Conducting Lighthouse analysis
- SEO optimization for web interfaces
- Ensuring design consistency

**Example prompt:**
```
"Create an accessible form component with proper ARIA labels."
```

---

### 🧐 Riley - Requirements Clarifier

**Expertise:** Requirement analysis, specification clarity, edge cases

**When to use:**
- Requirements are vague or incomplete
- Terms used are subjective ("fast", "intuitive")
- Constraints or edge cases are missing
- You need actionable specifications before implementation
- Scope is unclear or needs refinement

**Example prompt:**
```
"The requirement to 'make the system faster' is vague. Can you clarify what we need?"
```

---

### 😐 Skye - Code Implementer

**Expertise:** Well-defined specs, implementation, refactoring

**When to use:**
- Requirements are clear and well-specified
- Fixing bugs with clear root causes
- Refactoring code with defined goals
- Performance optimization with specific targets
- After requirements have been validated

**Example prompt:**
```
"Implement the user authentication system according to these specs."
```

---

### 😬 Theo - Ops & Monitoring Specialist

**Expertise:** System reliability, incident response, monitoring

**When to use:**
- After deployments to verify health
- Investigating errors or performance degradation
- Analyzing logs and metrics
- Implementing recovery mechanisms and retries
- Creating alerts and SLOs
- During incident triage and investigation
- Optimizing circuit breaker patterns

**Example prompt:**
```
"Our production system is experiencing high latency. Can you investigate?"
```

---

## Agent Selection Guide

### By Task Type

| Task | Primary Agent | Supporting Agents |
|------|---------------|------------------|
| New feature request | Riley → Kai | Skye |
| Bug fix | Skye | Theo (if incident), Finn (testing) |
| API integration | Mina | Iris (security), Skye |
| Database schema | Leo | Kai (architecture), Eden (docs) |
| UI component | Nova | Finn (testing), Iris (accessibility) |
| Deployment | Blake | Theo (monitoring), Eden (docs) |
| Security issue | Iris | Kai (arch), Mina (if API-related) |
| Documentation | Eden | Relevant domain specialist |
| Performance issue | Theo | Kai (architecture), Nova (if UI) |
| Vague requirement | Riley | Kai or domain expert |

### By Stage in Development

```
┌─────────────────────────────────────────────────────────────┐
│ DISCOVERY PHASE                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Riley (Clarify requirements)                            │ │
│ │ Kai (Architecture & design)                             │ │
│ │ Leo (Database design if needed)                         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ IMPLEMENTATION PHASE                                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Skye (Code implementation)                              │ │
│ │ Iris (Security review)                                  │ │
│ │ Nova (UI implementation if needed)                      │ │
│ │ Mina (Integration if needed)                            │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ VALIDATION PHASE                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Finn (Test coverage & quality)                          │ │
│ │ Iris (Security audit)                                   │ │
│ │ Theo (Performance check)                                │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ RELEASE PHASE                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Blake (Release coordination)                            │ │
│ │ Eden (Documentation & release notes)                    │ │
│ │ Theo (Post-deployment monitoring)                       │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Workflow Integration

### Automatic Hook Integration

The Orchestra Plugin automatically integrates with Claude Code through several hooks:

#### SessionStart Hook
- Displays available agents at session start
- Loads Orchestra plugin context and configuration

#### UserPromptSubmit Hook
- Checks for task clarity (suggests TodoWrite)
- Validates prompt structure for multi-agent coordination

#### PreToolUse Hook
- Safety validation (blocks dangerous operations)
- Routing compliance (ensures Task tool is used for agent invocation)

#### PostToolUse Hook
- Progress tracking integration
- Auto-updates task status in TodoWrite

### Manual Agent Invocation

Use the Task tool to invoke agents explicitly:

```
Task tool → subagent_type=<agent_type> → description → detailed prompt
```

**Example:**
```
Invoke Task tool with:
- subagent_type: "Iris"
- description: "Review auth implementation for security"
- prompt: "Review the authentication module for vulnerabilities..."
```

---

## Best Practices

### 1. Start with Requirements Clarity

**Pattern:**
```
"I want to add user authentication"
  ↓ (Vague - invoke Riley)
"Clarify what authentication methods we need"
  ↓ (Now clear)
"Implement JWT-based authentication with these specs"
  ↓ (Invoke Skye)
```

### 2. Use TodoWrite for Complex Tasks

When working with multiple agents, use TodoWrite to track:
- Each agent's contribution
- Dependencies between tasks
- Overall progress

**Example:**
```
Todos:
1. [in_progress] Riley: Clarify requirements
2. [pending] Kai: Design architecture
3. [pending] Skye: Implement feature
4. [pending] Iris: Security audit
5. [pending] Finn: Test coverage
6. [pending] Blake: Release coordination
```

### 3. Leverage Agent Combinations

**Security-sensitive feature:**
```
Riley (clarify) → Kai (design) → Mina (integrate) →
Iris (audit) → Skye (implement) → Finn (test) → Blake (deploy)
```

**UI component:**
```
Riley (clarify) → Nova (design) → Skye (implement) →
Finn (test) → Nova (review) → Blake (merge)
```

**Database migration:**
```
Kai (design) → Leo (schema) → Skye (migration) →
Theo (validation) → Blake (deploy)
```

### 4. Documentation First

After implementation, always involve Eden:
```
"Create documentation for the feature I just implemented"
```

This ensures knowledge is captured for the team and future Claude Code sessions.

### 5. Security-First Approach

Always involve Iris early:
```
"Before I implement this payment feature, can Iris review the security architecture?"
```

---

## Advanced Usage

### Parallel Agent Coordination

For independent tasks, invoke multiple agents in parallel:

```
I need:
1. Architecture review (Kai)
2. Database schema design (Leo)
3. Security assessment (Iris)

Can you coordinate these in parallel?
```

### Agent Chaining

Define explicit handoffs between agents:

```
"Riley: Clarify the payment integration requirements.
Then pass to Mina: Design the integration architecture.
Then Iris: Review for security.
Finally Skye: Implement the solution."
```

### Memory Bank Integration

Agents automatically read from Memory Bank:
- `project-overview.md` - Project context
- `tech-stack.md` - Technical decisions
- `decisions.md` - Architecture decisions
- `progress.md` - Current progress
- `next-steps.md` - Action items

Update Memory Bank after major milestones:
```
"Update Memory Bank with the new authentication architecture."
```

### Hook Environment Variables

Configure agent behavior through environment variables:

```bash
# Disable specific hooks
export ORCHESTRA_DISABLE_ROUTING_HOOK=1

# Enable stricter validation
export ORCHESTRA_STRICT_MODE=1

# Configure specific agents
export ORCHESTRA_DEFAULT_AGENT=Skye
```

---

## Common Patterns

### Pattern 1: Vague Feature Request → Clear Specification

**Initial state:** "Add user roles to the system"

**Steps:**
```
1. Invoke Riley: Clarify requirements
   - What roles do we need?
   - What permissions per role?
   - How should roles be assigned?

2. Invoke Kai: Validate architecture
   - Is RBAC appropriate?
   - How does this integrate with auth?

3. With clear specs, invoke Skye: Implement

4. Invoke Iris: Security audit

5. Invoke Finn: Test coverage

6. Invoke Blake: Release coordination
```

### Pattern 2: Emergency Production Bug

**Initial state:** "Users can't login!"

**Steps:**
```
1. Invoke Theo: Incident investigation
   - Check logs and metrics
   - Identify root cause
   - Assess impact

2. Invoke Skye: Fix the bug
   - Based on root cause analysis

3. Invoke Finn: Validate fix
   - Run tests
   - Verify no regression

4. Invoke Blake: Deploy hotfix
   - Rapid deployment process

5. Invoke Theo: Monitor post-deployment
   - Verify recovery
   - Set up alerts
```

### Pattern 3: Complex Integration

**Initial state:** "Integrate Stripe payment processing"

**Steps:**
```
1. Invoke Mina: Architecture review
   - Design integration points
   - Webhook strategy

2. Invoke Iris: Security planning
   - PCI compliance
   - Secret management
   - Payment data handling

3. Invoke Leo: Database schema
   - Payment records storage
   - Audit logging

4. Invoke Skye: Implementation
   - Implement integration

5. Invoke Finn: Comprehensive testing
   - Unit tests
   - Integration tests
   - Edge cases (failures, retries)

6. Invoke Blake: Controlled rollout
   - Staging deployment
   - Monitoring
   - Production deployment
```

### Pattern 4: UI Component Development

**Initial state:** "Create user settings form"

**Steps:**
```
1. Invoke Riley: Clarify requirements
   - What settings?
   - Validation rules?
   - Accessibility needs?

2. Invoke Nova: Design & implementation
   - Component structure
   - Accessibility (ARIA)
   - Responsive design
   - Performance

3. Invoke Finn: Testing
   - Component tests
   - Accessibility audit
   - Cross-browser testing

4. Invoke Nova: Final review
   - Design consistency
   - Polish

5. Invoke Blake: Merge & deploy
```

---

## Workflow Best Practices

### Code Review Checklist Before PR

```
Before creating PR, verify:
□ Riley: Requirements clarity (if uncertain)
□ Kai: Architectural alignment (if major change)
□ Iris: Security review (if auth/data/API change)
□ Finn: Test coverage (at least 80%)
□ Nova: UI consistency (if UI changes)
□ TodoWrite: All tasks marked completed
□ Blake: Release readiness
```

### Deployment Checklist

```
Before deploying:
□ Blake: Release notes prepared
□ Theo: Monitoring configured
□ Eden: Documentation updated
□ Finn: Smoke tests passing
□ Iris: Security clearance
□ All agents: Sign-off on readiness
```

### Post-Deployment Review

```
After deploying:
□ Theo: Monitor metrics for 30 min
□ Blake: Verify deployment success
□ Eden: Update deployment documentation
□ Create incident response plan if issues found
```

---

## Quick Reference

### When to Invoke Each Agent

| Agent | Signal Words |
|-------|--------------|
| Riley | vague, unclear, ambiguous, needs clarification |
| Kai | architecture, design, refactor, migration, performance |
| Skye | implement, build, code, fix bug, feature complete |
| Iris | security, auth, secret, API, vulnerability |
| Nova | UI, component, form, accessibility, design |
| Leo | database, migration, schema, RLS, index |
| Mina | integration, API, webhook, external service |
| Finn | test, coverage, failing, flaky, QA |
| Theo | production, monitoring, incident, logs, metrics |
| Blake | deploy, release, rollout, merge, hotfix |
| Eden | documentation, README, guide, runbook, handbook |

### Agents by Availability

All 11 agents are available 24/7 for:
- Code review and feedback
- Design consultation
- Implementation guidance
- Testing and validation
- Documentation

No special permissions required - just invoke via Task tool.

---

## Environment Variables

Configure Orchestra behavior in `.claude.json` or via `export`:

```json
{
  "orchestraConfig": {
    "defaultAgent": "Riley",
    "parallelization": "enabled",
    "memoryBankSync": "auto",
    "hookValidation": "strict"
  }
}
```

---

## Support

For help using Orchestra agents:
- Review agent descriptions in this guide
- Check examples in [PHASE-2-QUICKSTART.md](PHASE-2-QUICKSTART.md)
- Read [ORCHESTRATION-SETUP.md](ORCHESTRATION_SETUP.md) for workflow setup
- Consult Memory Bank for project-specific context

Happy collaborating! 🎭
