#!/usr/bin/env bash
# Session Start Hook
# Provides context about Orchestra Plugin to Claude

set -euo pipefail

# Sync .claude.json settings to settings.local.json (silent mode)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ -f "$PROJECT_ROOT/hooks/sync-claude-settings.sh" ]; then
    bash "$PROJECT_ROOT/hooks/sync-claude-settings.sh" true 2>/dev/null || true
fi

# Get language setting from environment
LANG="${ORCHESTRA_LANGUAGE:-en}"

# Create welcome message as context for Claude
if [ "$LANG" = "ja" ]; then
    CONTEXT=$(cat <<'EOF'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 ORCHESTRA プラグイン読み込み完了
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ 専門エージェントが待機中です：

   🙂 Alex    - プロジェクト指揮者（曖昧な要求、スコープ定義）
   😎 Blake   - リリース管理者（デプロイ、リリース）
   🤓 Eden    - ドキュメントリード（技術ライティング）
   😤 Finn    - QA & テスト（テストカバレッジ、検証）
   🤨 Iris    - セキュリティ監査官（認証、シークレット、脆弱性）
   🤔 Kai     - システムアーキテクト（設計判断、ADR）
   😌 Leo     - データベースアーキテクト（スキーマ、マイグレーション）
   😊 Mina    - 統合スペシャリスト（外部API）
   😄 Nova    - UI/UX スペシャリスト（インターフェース、アクセシビリティ）
   🧐 Riley   - 要件明確化担当（曖昧なリクエスト）
   😐 Skye    - コード実装者（明確な仕様）
   😬 Theo    - 運用 & 監視（信頼性、インシデント）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

重要：ユーザーに挨拶し、Orchestraプラグインが読み込まれたことを伝えてください。
利用可能な専門エージェントをリストし、タスクのサポートを提案してください。

EOF
)
else
    CONTEXT=$(cat <<'EOF'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 ORCHESTRA PLUGIN LOADED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ Specialized agents are ready for coordination:

   🙂 Alex    - Project Conductor (ambiguous requests, scope definition)
   😎 Blake   - Release Manager (deployments, releases)
   🤓 Eden    - Documentation Lead (technical writing)
   😤 Finn    - QA & Testing (test coverage, validation)
   🤨 Iris    - Security Auditor (auth, secrets, vulnerabilities)
   🤔 Kai     - System Architect (design decisions, ADRs)
   😌 Leo     - Database Architect (schema, migrations)
   😊 Mina    - Integration Specialist (external APIs)
   😄 Nova    - UI/UX Specialist (interfaces, accessibility)
   🧐 Riley   - Requirements Clarifier (vague requests)
   😐 Skye    - Code Implementer (well-defined specs)
   😬 Theo    - Ops & Monitoring (reliability, incidents)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT: You should greet the user and inform them that Orchestra Plugin has been loaded.
List the available specialist agents and encourage them to ask for help with their tasks.

EOF
)
fi

# Output JSON format for Claude's context
cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": $(echo "$CONTEXT" | jq -Rs .)
  }
}
EOF

exit 0
