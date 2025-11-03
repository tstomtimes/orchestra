# Orchestra Plugin Localization Guide

## Overview

The Orchestra Plugin now supports Japanese localization through the `ORCHESTRA_LANGUAGE` environment variable. This allows all plugin UI messages, hooks, and agent communications to be displayed in Japanese while keeping code comments and commit messages in English.

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# Language Settings
ORCHESTRA_LANGUAGE=ja  # or 'en' for English (default)
COMMIT_LANGUAGE=en     # Commit messages remain in English by default
```

### What Gets Localized

When `ORCHESTRA_LANGUAGE=ja`:

1. **Session Messages**
   - Plugin welcome messages
   - Agent list and descriptions

2. **Agent Auto-Routing**
   - Routing reminders
   - Agent-specific instructions
   - Action requirements

3. **Task Clarity Reminders**
   - Best practice messages
   - Validation warnings
   - Task definition checks

4. **Quality Gate Messages**
   - `before_pr.sh`: Lint, type checking, test, secret scanning
   - `before_merge.sh`: E2E tests, Lighthouse CI, visual regression
   - `before_deploy.sh`: Environment checks, migrations, health checks, build validation
   - `after_deploy.sh`: Smoke tests, deployment status, rollback instructions

### What Doesn't Get Localized

1. **Code Comments**: Always in English for international collaboration
2. **Commit Messages**: Controlled separately by `COMMIT_LANGUAGE`
3. **Technical Commands**: Command-line tools remain unchanged
4. **File Names**: All file paths and names remain in English

## Usage Examples

### English (Default)

```bash
# .env
ORCHESTRA_LANGUAGE=en
```

Output:
```
🎭 ORCHESTRA PLUGIN LOADED
✨ Specialized agents are ready for coordination:
   🙂 Alex    - Project Conductor (ambiguous requests, scope definition)
   😐 Skye    - Code Implementer (well-defined specs)
```

### Japanese

```bash
# .env
ORCHESTRA_LANGUAGE=ja
```

Output:
```
🎭 ORCHESTRA プラグイン読み込み完了
✨ 専門エージェントが待機中です：
   🙂 Alex    - プロジェクト指揮者（曖昧な要求、スコープ定義）
   😐 Skye    - コード実装者（明確な仕様）
```

## Implementation Details

### Architecture

Each hook script checks the `ORCHESTRA_LANGUAGE` environment variable:

```bash
# Get language setting from environment
LANG="${ORCHESTRA_LANGUAGE:-en}"

if [ "$LANG" = "ja" ]; then
  # Japanese messages
else
  # English messages (default)
fi
```

### Affected Files

#### Priority 1 (User-facing messages)
- `/hooks/session-start.sh` - Session start messages
- `/hooks/agent-routing-reminder.sh` - Agent routing reminders
- `/hooks/before_task.sh` - Task clarity reminders

#### Priority 2 (Quality gates)
- `/hooks/before_pr.sh` - Pre-PR quality checks
- `/hooks/before_merge.sh` - Pre-merge integration tests
- `/hooks/before_deploy.sh` - Pre-deployment validation
- `/hooks/after_deploy.sh` - Post-deployment verification

## Testing

To test the localization:

1. Update your `.env` file:
   ```bash
   ORCHESTRA_LANGUAGE=ja
   ```

2. Restart Claude Code or reload the plugin

3. Observe the messages in your next session:
   - Session start should show Japanese messages
   - Agent routing should use Japanese instructions
   - Quality gate messages should display in Japanese

4. To switch back to English:
   ```bash
   ORCHESTRA_LANGUAGE=en
   ```

## Translation Quality

All Japanese translations follow these principles:

1. **Natural Japanese**: Uses appropriate business/technical Japanese
2. **Clarity**: Technical terms remain recognizable (e.g., "API", "Docker")
3. **Consistency**: Agent names remain in English for clarity
4. **Professional**: Suitable for professional development environments

## Future Enhancements

Potential improvements for future versions:

1. Support for additional languages (Spanish, French, Chinese, etc.)
2. Dynamic language switching within a session
3. Localized documentation
4. Language-specific agent personalities
5. Internationalization framework for easier translation management

## Troubleshooting

### Language not switching

1. Check your `.env` file has `ORCHESTRA_LANGUAGE=ja`
2. Ensure the `.env` file is in the project root
3. Restart Claude Code to reload environment variables

### Mixed language output

This is expected behavior:
- Code comments remain in English
- Technical command output remains unchanged
- Only plugin-generated messages are localized

### Missing translations

If you find untranslated messages, please report them. The implementation covers:
- All session start messages
- All agent routing reminders
- All quality gate hooks
- All task clarity reminders

## Contributing

To add translations for a new language:

1. Add language check in hook scripts:
   ```bash
   LANG="${ORCHESTRA_LANGUAGE:-en}"

   if [ "$LANG" = "ja" ]; then
     # Japanese
   elif [ "$LANG" = "es" ]; then
     # Spanish
   else
     # English (default)
   fi
   ```

2. Translate all user-facing messages
3. Keep technical terms and agent names in English
4. Test thoroughly before submitting

## Support

For questions or issues with localization:
1. Check this documentation
2. Review the `.env.example` file
3. Examine hook script implementations
4. Open an issue on GitHub

---

**Note**: This localization system prioritizes user experience while maintaining code quality standards and international collaboration compatibility.
