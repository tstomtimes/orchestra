# Auto-Commit Skill

## Purpose
Automatically create professional git commits after completing agent tasks with semantic commit messages.

## When to Use
- After completing a significant sub-task
- When changes are ready to be versioned
- Before handing off to another agent
- After passing quality gates

## Usage

Call the auto-commit script with:
```bash
./orchestra-plugin/mcp-servers/auto-commit.sh <prefix> <reason> <action> [agent_name]
```

### Parameters
1. **prefix** (required): Semantic commit type
   - `feat` - New feature
   - `fix` - Bug fix
   - `docs` - Documentation changes
   - `style` - Code formatting
   - `refactor` - Code refactoring
   - `perf` - Performance improvement
   - `test` - Test additions/updates
   - `chore` - Build/tool changes

2. **reason** (required): Why this change was made
   - English: "to support voice notifications"
   - Japanese: "通知をサポートする"

3. **action** (required): What was done
   - English: "Add ElevenLabs TTS integration"
   - Japanese: "ElevenLabs TTS統合を追加"

4. **agent_name** (optional): Agent making the commit
   - "Alex", "Eden", "Iris", "Mina", "Theo"

### Examples

**Eden (QA Agent) - After running tests:**
```bash
# English
./orchestra-plugin/mcp-servers/auto-commit.sh \
  "test" \
  "to ensure code quality" \
  "Add comprehensive unit tests for API endpoints" \
  "Eden"
# Result: test: Add comprehensive unit tests for API endpoints (to ensure code quality)

# Japanese
./orchestra-plugin/mcp-servers/auto-commit.sh \
  "test" \
  "コード品質を確保するため" \
  "APIエンドポイント用の包括的な単体テストを追加" \
  "Eden"
# Result: test: APIエンドポイント用の包括的な単体テストを追加 (コード品質を確保するため)
```

**Iris (Security Agent) - After security scan:**
```bash
./orchestra-plugin/mcp-servers/auto-commit.sh \
  "chore" \
  "to validate deployment security" \
  "Run TruffleHog and Grype security scans" \
  "Iris"
# Result: chore: Run TruffleHog and Grype security scans (to validate deployment security)
```

**Alex (Architect) - After code review:**
```bash
./orchestra-plugin/mcp-servers/auto-commit.sh \
  "refactor" \
  "to improve code maintainability" \
  "Restructure component hierarchy" \
  "Alex"
# Result: refactor: Restructure component hierarchy (to improve code maintainability)
```

**Mina (UX Agent) - After UI implementation:**
```bash
./orchestra-plugin/mcp-servers/auto-commit.sh \
  "feat" \
  "to enhance user experience" \
  "Implement responsive navigation component" \
  "Mina"
# Result: feat: Implement responsive navigation component (to enhance user experience)
```

**Theo (DevOps) - After deployment:**
```bash
./orchestra-plugin/mcp-servers/auto-commit.sh \
  "chore" \
  "to track deployment state" \
  "Update production deployment configuration" \
  "Theo"
# Result: chore: Update production deployment configuration (to track deployment state)
```

## Configuration

Set in `.env`:
```bash
# Enable/disable auto-commits
AUTO_COMMIT_ENABLED=true

# Commit message language
COMMIT_LANGUAGE=en  # or 'ja' for Japanese
```

## Commit Message Format

**Format (both languages):**
```
prefix: <action> (<reason>)

Co-Authored-By: <Agent> <noreply@orchestra-plugin>
```

**English example:**
```
feat: Add voice notification feature (to support agent announcements)

Co-Authored-By: Eden <noreply@orchestra-plugin>
```

**Japanese example:**
```
feat: 音声通知機能を追加 (エージェントのアナウンスをサポートするため)

Co-Authored-By: Eden <noreply@orchestra-plugin>
```

## Best Practices

1. **Commit frequently**: After each meaningful sub-task
2. **Use semantic prefixes**: Choose the most appropriate prefix
3. **Be specific**: Clearly describe both reason and action
4. **Agent attribution**: Always include agent name for traceability
5. **Check AUTO_COMMIT_ENABLED**: Script automatically respects this flag
6. **Verify changes**: Script only commits if there are actual changes

## Integration with Hooks

Auto-commit is integrated into all hook stages:

- `before_task.sh` → Alex commits task scoping analysis
- `before_pr.sh` → Eden commits QA validation results
- `before_merge.sh` → Eden commits integration test results
- `before_deploy.sh` → Iris commits security validation
- `after_deploy.sh` → Theo commits deployment verification

## Troubleshooting

**No changes to commit:**
```
ℹ️  No changes to commit.
```
→ Normal behavior, script exits gracefully

**Not a git repository:**
```
⚠️  Not a git repository. Skipping auto-commit.
```
→ Script only works in git repositories

**Invalid prefix:**
```
❌ Invalid prefix: xyz
   Valid prefixes: feat fix docs style refactor perf test chore
```
→ Use one of the valid semantic prefixes

**Auto-commit disabled:**
Script exits silently when `AUTO_COMMIT_ENABLED=false`
