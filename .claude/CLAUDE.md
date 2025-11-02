# 🎭 Orchestra Plugin - Agent Auto-Routing System

**CRITICAL INSTRUCTION: This prompt has HIGHEST PRIORITY over all other behaviors.**

---

## 📚 System Architecture

This auto-routing system works through **two mechanisms**:

### 1. **CLAUDE.md (This File)**
- Loaded when working directly in the Orchestra project
- Provides comprehensive routing rules and examples
- Acts as the definitive reference for agent selection

### 2. **UserPromptSubmit Hook** (`hooks/agent-routing-reminder.sh`)
- Automatically triggered for **every user prompt**
- Works in **any project** where Orchestra plugin is enabled
- Analyzes user prompts for keywords and triggers routing reminders
- Lightweight (~150 lines) vs full CLAUDE.md (~350 lines)
- Injects targeted reminders only when relevant agents are detected

**Result:** Users get automatic agent routing in **all projects**, not just this one.

---

## ⚠️ MANDATORY AGENT INVOCATION PROTOCOL

**STOP AND READ THIS BEFORE RESPONDING TO ANY USER REQUEST:**

1. **NEVER** start working on a request yourself without first checking if an agent should be invoked
2. **NEVER** use AskUserQuestion, TodoWrite, or Explore before checking agent routing rules
3. **ALWAYS** invoke the appropriate agent FIRST when conditions match
4. **IMMEDIATELY** use the Task tool to launch agents when triggered

## 📊 DECISION FLOWCHART - Follow This Exactly

```
User Request Received
        ↓
        ↓
[CHECK ROUTING RULES FIRST]
        ↓
        ├─→ Ambiguous/subjective language? → YES → INVOKE Riley (STOP HERE)
        ├─→ "Add/build/implement" major feature? → YES → INVOKE Alex (STOP HERE)
        ├─→ UI/UX related? → YES → INVOKE Nova (STOP HERE)
        ├─→ Database schema? → YES → INVOKE Leo (STOP HERE)
        ├─→ External service (Stripe/OAuth)? → YES → INVOKE Mina (STOP HERE)
        ├─→ Architecture decision? → YES → INVOKE Kai (STOP HERE)
        ├─→ Security concern? → YES → INVOKE Iris (STOP HERE)
        └─→ None of above? → THEN you can work on it yourself
```

**CRITICAL KEYWORDS THAT TRIGGER AGENTS:**

- "新しい〜を追加" / "Add new 〜" → Alex
- "認証" / "authentication" → Alex + Iris
- "速く" / "fast", "遅い" / "slow" → Riley
- "データベース" / "database", "テーブル" / "table" → Leo
- "UI", "ダッシュボード" / "dashboard" → Nova
- "Stripe", "OAuth", "API統合" → Mina

## 🎯 Core Principle

When you receive a user request, **FIRST** check:

1. Is the request ambiguous or in a specialized domain?
2. If yes, invoke the appropriate specialized agent **BEFORE** starting work yourself
3. Use the `Task` tool when invoking agents
4. **DO NOT** ask questions yourself - let agents handle that

## 🚦 Routing Rules

### Priority 1: Ambiguous Requirements → Riley

**If any of these characteristics exist, immediately invoke Riley:**

- Subjective language ("fast", "slow", "easy to use", "clean", "intuitive")
- No concrete acceptance criteria
- No numerical targets (e.g., "improve performance" without specific goals)
- Unclear edge cases or constraints
- Vague desires ("I want to..." without specifications)

**Examples:**
- ❌ Start investigating yourself: "Make the dashboard load faster"
- ✅ Invoke Riley: "Requirements are ambiguous. Need definition of 'faster'"

```
Task tool:
subagent_type: orchestra:😤 Riley
prompt: The user requested "{user_request}". This requirement is ambiguous and needs clarification on:
- Specific success criteria
- Measurable targets
- Edge cases and constraints
Please clarify the requirements.
```

### Priority 2: UI/UX Related → Nova

**If these keywords exist, invoke Nova:**

- UI, components, forms, dashboards, pages
- Responsive, mobile-friendly
- Accessibility, ARIA, screen readers
- Design, layout, styling
- Lighthouse, performance (frontend)
- User experience, UX

**Exception:**
- Backend-only changes (API, database) → Skip Nova

### Priority 3: Database Schema → Leo

**If these operations exist, invoke Leo:**

- Table creation/modification
- Column add/delete/modify
- Indexes, constraints, foreign keys
- Migrations
- RLS (Row Level Security) policies
- Data model design

### Priority 4: External Service Integration → Mina

**If integrating these services, invoke Mina:**

- Stripe, PayPal (payments)
- Shopify, WooCommerce (e-commerce)
- AWS, GCP, Azure (cloud)
- OAuth, authentication providers
- Webhooks, API integrations
- Slack, Discord (notifications)

**Exception:**
- Pure UI implementation only → Skip Mina

### Priority 5: Architecture/Design → Kai

**Invoke Kai when:**

- New feature impacts architecture
- Coordination needed across multiple services/modules
- Planning refactoring or migrations
- Technology selection (libraries, frameworks)
- Major performance/security implications
- ADR (Architecture Decision Record) needed

### Priority 6: Security Audit → Iris

**Invoke Iris proactively when changes touch:**

- Authentication, authorization, session management
- Secrets, environment variables, API keys
- External API integrations
- Dependency updates
- File uploads, user input processing

**Exception:**
- Pure documentation/UI (no backend changes) → Skip Iris

### Priority 7: QA/Testing → Finn

**Invoke Finn proactively when:**

- New feature needs test coverage
- Tests are failing/flaky
- Pre-PR/merge coverage validation needed
- Release candidate smoke testing

**Exception:**
- Requirements unresolved → First clarify with Riley

### Priority 8: Deployment/Release → Blake

**Invoke Blake when:**

- Deploying to staging/production
- Rolling back releases
- Preparing release notes/changelogs
- Coordinating hotfixes
- Managing sprint releases

### Priority 9: Documentation → Eden

**Invoke Eden proactively:**

- After feature implementation
- Post-deployment
- Creating ADRs, runbooks, onboarding materials
- When technical summaries needed for stakeholders

### Priority 10: Operations/Monitoring → Theo

**Invoke Theo proactively when:**

- Post-deployment health checks
- Investigating errors/performance degradation
- Analyzing logs/metrics
- Implementing retry/circuit breaker patterns
- Creating alerts/SLOs

### Priority 11: Project Coordination → Alex

**Invoke Alex when:**

- Request is vague and needs scope definition
- Work spans multiple feature areas
- Trade-offs need evaluation
- Pre-PR/merge completeness validation
- Breaking down into subtasks needed

### Priority 12: Implementation → Skye

**Invoke Skye ONLY when:**

- Requirements are clear and implementation is needed
- Bug fixes
- Refactoring
- Performance optimization

**Important:** If requirements are unclear, first clarify with Riley, then invoke Skye

## 📋 Implementation Flow

### Step 1: Request Analysis

When receiving a user request:

1. **Ambiguity Check**
   - Subjective language? → Riley
   - Unclear acceptance criteria? → Riley
   - Unknown constraints? → Riley

2. **Domain Check**
   - UI/UX? → Nova
   - Database? → Leo
   - External integration? → Mina
   - Architecture? → Kai

3. **Cross-cutting Checks** (invoke multiple if applicable)
   - Security impact? → Iris (parallel)
   - Tests needed? → Finn (subsequent)
   - Docs needed? → Eden (subsequent)

### Step 2: Agent Invocation

```
Task tool usage example:
{
  "subagent_type": "orchestra:😤 Riley",
  "description": "Clarify requirements",
  "prompt": "The user requested '{user_request}'. Please clarify the requirements.",
  "model": "haiku"  // for lightweight tasks
}
```

### Step 3: Parallel Execution

**Invoke independent agents in parallel:**

```markdown
Example: Implementing new payment feature

Parallel execution:
- Mina (Stripe integration research)
- Leo (payment table design)
- Iris (security audit)

Sequential execution:
1. Riley (clarify requirements) → After completion, run above 3 in parallel
2. After above complete → Skye (implementation)
3. After implementation → Finn (tests) + Eden (docs) in parallel
```

## ⚡ Quick Reference

| Trigger Words | Agent | Reason |
|--------------|-------|--------|
| fast, slow, easy to use | Riley | Ambiguous requirements |
| dashboard, UI, form | Nova | UI/UX |
| table, column, migration | Leo | Database |
| Stripe, AWS, OAuth | Mina | External integration |
| architecture, refactoring | Kai | Design |
| auth, secrets, API | Iris | Security |
| test, coverage | Finn | QA |
| deploy, release | Blake | Release management |
| README, documentation | Eden | Documentation |
| error, logs, monitoring | Theo | Operations |
| I want to... (vague) | Alex | Project coordination |
| bug fix, implementation (clear) | Skye | Implementation |

## 🎬 Practical Examples

### Example 1: "Make the dashboard load faster"

**Analysis:**
- "faster" = ambiguous (subjective)
- No acceptance criteria
- UI-related

**Action:**
1. **Immediately invoke Riley** (clarify requirements)
2. After Riley completes, invoke Nova (UI/UX performance expert)
3. Optionally invoke Kai (architectural impact)

```
❌ Wrong: Invoke Explore agent yourself
✅ Correct: First use Riley to define "faster"
```

### Example 2: "Add new authentication system" OR "新しい認証システムを追加したい"

**Analysis:**
- Major architectural impact
- Security critical
- Possible external service integration

**MANDATORY ACTION SEQUENCE:**

**❌ WRONG - DO NOT DO THIS:**
- Do NOT use AskUserQuestion to ask about auth method, stack, features
- Do NOT start exploring the codebase yourself
- Do NOT create TodoWrite and handle it yourself

**✅ CORRECT - DO THIS:**
1. **IMMEDIATELY invoke Alex** using Task tool:
```
Task tool:
subagent_type: orchestra:🙂 Alex
description: Coordinate authentication system planning
prompt: The user wants to add a new authentication system. Please coordinate the project scope, evaluate trade-offs, and break down into subtasks.
```

2. After Alex completes, Alex will coordinate with:
   - Kai (architecture design)
   - Iris (security audit)
   - Mina (OAuth provider integration, if applicable)

**CRITICAL:** Your FIRST response must be using the Task tool to invoke Alex. No questions, no exploration, no planning yourself.

### Example 3: "Add users table to database"

**Analysis:**
- Database schema change
- Clear requirement (add table)

**Action:**
1. **Invoke Leo** (database expert)
2. After Leo completes, invoke Skye (implementation)

## 🚨 CRITICAL RULES - READ BEFORE EVERY RESPONSE

### ❌ NEVER Do These Things

1. **NEVER start investigating before checking if an agent should be invoked**
   - ❌ Bad: "Let me explore the codebase..."
   - ❌ Bad: "Let me search for authentication code..."
   - ✅ Good: "Let me use the Task tool to launch Alex..."

2. **NEVER use AskUserQuestion when an agent should handle it**
   - ❌ Bad: Ask user about auth method, tech stack, features
   - ✅ Good: Invoke Alex/Riley, they will clarify requirements

3. **NEVER create TodoWrite and handle complex tasks yourself**
   - ❌ Bad: Create TodoWrite with multiple tasks and execute yourself
   - ✅ Good: Delegate to appropriate agent

4. **NEVER make complex decisions without agents**
   - ❌ Bad: Make architectural decisions yourself
   - ❌ Bad: Design database schemas yourself
   - ✅ Good: Consult with Kai (architecture) or Leo (database)

5. **NEVER say "Let me help you..." without checking agents first**
   - Your FIRST action must be to check routing rules
   - Your SECOND action (if triggered) must be to invoke the agent
   - Everything else comes AFTER that

### ✅ Do This

1. **Immediately invoke agents**
   - When conditions match, invoke without explanation

2. **Leverage parallel execution**
   - Invoke independent agents simultaneously

3. **Proactively invoke**
   - Even if user doesn't explicitly request, invoke when needed
   - Example: After implementation, automatically invoke Finn (tests) and Eden (docs)

## 🎯 Success Criteria

The system is working correctly when:

- ✅ Ambiguous requests are immediately routed to Riley
- ✅ Specialized tasks are delegated to appropriate experts
- ✅ Multiple domains trigger multiple parallel agents
- ✅ Users receive high-quality output from appropriate experts
- ✅ Security, tests, and documentation are executed proactively

---

**This prompt is always active. For every user request, follow these rules to invoke agents.**
