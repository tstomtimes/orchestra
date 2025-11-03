#!/usr/bin/env bash
# Agent Auto-Routing Reminder Hook
# Analyzes user prompts and injects routing reminders for specialized agents
#
# This hook enables automatic agent invocation by detecting keywords
# and triggering appropriate specialist agents

set -euo pipefail

# Get language setting from environment
LANG="${ORCHESTRA_LANGUAGE:-en}"

# Read JSON input from stdin
INPUT_JSON=$(cat)

# Extract user prompt from JSON
USER_PROMPT=$(echo "$INPUT_JSON" | jq -r '.prompt // empty' 2>/dev/null || echo "")

# If no prompt provided, exit silently
if [ -z "$USER_PROMPT" ]; then
    exit 0
fi

# Convert to lowercase for case-insensitive matching
PROMPT_LOWER=$(echo "$USER_PROMPT" | tr '[:upper:]' '[:lower:]')

# Track if any agent was matched
AGENT_MATCHED=false
MATCHED_AGENTS=()

# --- Priority 1: Ambiguous Requirements → Riley ---
if echo "$PROMPT_LOWER" | grep -qE "(fast|faster|slow|slower|easy to use|intuitive|clean|simple|improve performance|optimize|better)"; then
    MATCHED_AGENTS+=("Riley")
    AGENT_MATCHED=true
fi

# --- Priority 2: Major Feature Addition → Alex ---
if echo "$PROMPT_LOWER" | grep -qE "(add new|build new|implement new|create new|新しい.*追加|新規.*作成|作りたい|作る|build|make|開発したい)"; then
    if echo "$PROMPT_LOWER" | grep -qE "(system|feature|authentication|auth|認証|payment|決済|api|site|サイト|app|アプリ|website|ウェブサイト|service|サービス)"; then
        MATCHED_AGENTS+=("Alex")
        AGENT_MATCHED=true
    fi
fi

# Authentication specifically triggers Alex + Iris
if echo "$PROMPT_LOWER" | grep -qE "(authentication|auth|login|認証|ログイン|oauth|jwt|session)"; then
    if ! [[ " ${MATCHED_AGENTS[@]+"${MATCHED_AGENTS[@]}"} " =~ " Alex " ]]; then
        MATCHED_AGENTS+=("Alex")
        AGENT_MATCHED=true
    fi
fi

# --- Priority 3: UI/UX → Nova ---
if echo "$PROMPT_LOWER" | grep -qE "(ui|dashboard|ダッシュボード|component|コンポーネント|form|フォーム|design|デザイン|layout|responsive|accessibility|a11y|lighthouse|portfolio|ポートフォリオ|landing.*page|ランディング.*ページ|website|ウェブサイト|site.*design|サイト.*デザイン)"; then
    MATCHED_AGENTS+=("Nova")
    AGENT_MATCHED=true
fi

# --- Priority 4: Database → Leo ---
if echo "$PROMPT_LOWER" | grep -qE "(database|データベース|table|テーブル|schema|スキーマ|migration|マイグレーション|column|カラム|index|インデックス|rls)"; then
    MATCHED_AGENTS+=("Leo")
    AGENT_MATCHED=true
fi

# --- Priority 5: External Integration → Mina ---
if echo "$PROMPT_LOWER" | grep -qE "(stripe|paypal|shopify|aws|gcp|azure|oauth|webhook|api integration|統合)"; then
    MATCHED_AGENTS+=("Mina")
    AGENT_MATCHED=true
fi

# --- Priority 6: Architecture → Kai ---
if echo "$PROMPT_LOWER" | grep -qE "(architecture|アーキテクチャ|refactor|リファクタ|design pattern|adr|technical decision)"; then
    MATCHED_AGENTS+=("Kai")
    AGENT_MATCHED=true
fi

# --- Priority 7: Security → Iris ---
if echo "$PROMPT_LOWER" | grep -qE "(security|セキュリティ|secret|シークレット|vulnerability|脆弱性|encryption|暗号化)"; then
    MATCHED_AGENTS+=("Iris")
    AGENT_MATCHED=true
fi

# --- Default: If no specific agent matched, route to Alex (Project Conductor) ---
if [ "$AGENT_MATCHED" = false ]; then
    MATCHED_AGENTS+=("Alex")
    AGENT_MATCHED=true
fi

# If any agents matched, output routing reminder as context for Claude
if [ "$AGENT_MATCHED" = true ]; then
    # Build context message based on language
    if [ "$LANG" = "ja" ]; then
        CONTEXT=$(cat <<EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 エージェント自動ルーティングリマインダー
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  重要：専門領域を検出しました。

📋 マッチしたエージェント：${MATCHED_AGENTS[*]+"${MATCHED_AGENTS[*]}"}

🚨 必須アクション：

EOF
)

        # Add agent-specific instructions in Japanese
        for agent in "${MATCHED_AGENTS[@]}"; do
            case $agent in
                "Riley")
                    CONTEXT+=$(cat <<EOF

   • Riley（要件明確化担当）：曖昧・主観的な表現を検出
     → 直ちに実行：Taskツールで subagent_type="orchestra:🧐 Riley" を呼び出す
     → 理由：「速い」「遅い」「より良い」などの用語は具体的な基準が必要

EOF
)
                    ;;
                "Alex")
                    CONTEXT+=$(cat <<EOF

   • Alex（プロジェクト指揮者）：大規模機能追加を検出
     → 直ちに実行：Taskツールで subagent_type="orchestra:🙂 Alex" を呼び出す
     → 理由：新システムにはスコープ定義と調整が必要

EOF
)
                    ;;
                "Nova")
                    CONTEXT+=$(cat <<EOF

   • Nova（UI/UX スペシャリスト）：ユーザーインターフェース作業を検出
     → 直ちに実行：Taskツールで subagent_type="orchestra:😄 Nova" を呼び出す
     → 理由：UI/UXにはアクセシビリティ、パフォーマンス、デザインの専門知識が必要

EOF
)
                    ;;
                "Leo")
                    CONTEXT+=$(cat <<EOF

   • Leo（データベースアーキテクト）：データベーススキーマ作業を検出
     → 直ちに実行：Taskツールで subagent_type="orchestra:😌 Leo" を呼び出す
     → 理由：スキーマ変更には適切な設計、マイグレーション、RLSポリシーが必要

EOF
)
                    ;;
                "Mina")
                    CONTEXT+=$(cat <<EOF

   • Mina（統合スペシャリスト）：外部サービス統合を検出
     → 直ちに実行：Taskツールで subagent_type="orchestra:😊 Mina" を呼び出す
     → 理由：統合には安全な設定とエラーハンドリングが必要

EOF
)
                    ;;
                "Kai")
                    CONTEXT+=$(cat <<EOF

   • Kai（システムアーキテクト）：アーキテクチャ判断を検出
     → 直ちに実行：Taskツールで subagent_type="orchestra:🤔 Kai" を呼び出す
     → 理由：アーキテクチャ変更には設計レビューとADRドキュメントが必要

EOF
)
                    ;;
                "Iris")
                    CONTEXT+=$(cat <<EOF

   • Iris（セキュリティ監査官）：セキュリティ重要作業を検出
     → 直ちに実行：Taskツールで subagent_type="orchestra:🤨 Iris" を呼び出す
     → 理由：セキュリティには脆弱性とシークレット処理の監査が必要

EOF
)
                    ;;
            esac
        done

        CONTEXT+=$(cat <<EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ 禁止事項：
   - ルーティングルールを確認せずにAskUserQuestionを使用
   - 自分でコードベースを探索開始
   - TodoWriteを作成して自分で処理

✅ 代わりにこれを実行：
   1. Taskツールを使用して適切なエージェントを呼び出す
   2. 専門エージェントに作業を任せる
   3. 彼らの出力をレビューし、次のステップを調整

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF
)
    else
        CONTEXT=$(cat <<EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 AGENT AUTO-ROUTING REMINDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  CRITICAL: Detected specialized domain in user request.

📋 Matched Agents: ${MATCHED_AGENTS[*]+"${MATCHED_AGENTS[*]}"}

🚨 MANDATORY ACTION REQUIRED:

EOF
)

        # Add agent-specific instructions in English
        for agent in "${MATCHED_AGENTS[@]}"; do
            case $agent in
                "Riley")
                    CONTEXT+=$(cat <<EOF

   • Riley (Clarifier): User request contains ambiguous/subjective language
     → IMMEDIATELY invoke: Task tool with subagent_type="orchestra:🧐 Riley"
     → Reason: Terms like 'fast', 'slow', 'better' require specific criteria

EOF
)
                    ;;
                "Alex")
                    CONTEXT+=$(cat <<EOF

   • Alex (Project Conductor): Major feature addition detected
     → IMMEDIATELY invoke: Task tool with subagent_type="orchestra:🙂 Alex"
     → Reason: New systems need scope definition and coordination

EOF
)
                    ;;
                "Nova")
                    CONTEXT+=$(cat <<EOF

   • Nova (UI/UX Specialist): User interface work detected
     → IMMEDIATELY invoke: Task tool with subagent_type="orchestra:😄 Nova"
     → Reason: UI/UX requires accessibility, performance, and design expertise

EOF
)
                    ;;
                "Leo")
                    CONTEXT+=$(cat <<EOF

   • Leo (Database Architect): Database schema work detected
     → IMMEDIATELY invoke: Task tool with subagent_type="orchestra:😌 Leo"
     → Reason: Schema changes need proper design, migrations, and RLS policies

EOF
)
                    ;;
                "Mina")
                    CONTEXT+=$(cat <<EOF

   • Mina (Integration Specialist): External service integration detected
     → IMMEDIATELY invoke: Task tool with subagent_type="orchestra:😊 Mina"
     → Reason: Integrations require secure config and error handling

EOF
)
                    ;;
                "Kai")
                    CONTEXT+=$(cat <<EOF

   • Kai (System Architect): Architectural decision detected
     → IMMEDIATELY invoke: Task tool with subagent_type="orchestra:🤔 Kai"
     → Reason: Architecture changes need design review and ADR documentation

EOF
)
                    ;;
                "Iris")
                    CONTEXT+=$(cat <<EOF

   • Iris (Security Auditor): Security-critical work detected
     → IMMEDIATELY invoke: Task tool with subagent_type="orchestra:🤨 Iris"
     → Reason: Security requires audit for vulnerabilities and secret handling

EOF
)
                    ;;
            esac
        done

        CONTEXT+=$(cat <<EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ DO NOT:
   - Use AskUserQuestion without checking routing rules
   - Start exploring codebase yourself
   - Create TodoWrite and handle it yourself

✅ DO THIS INSTEAD:
   1. Use the Task tool to invoke the appropriate agent(s)
   2. Let the specialist agent handle the work
   3. Review their output and coordinate next steps

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF
)
    fi

    # Output JSON format for Claude's context
    cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": $(echo "$CONTEXT" | jq -Rs .)
  }
}
EOF
fi

# Always approve (exit 0) - we're just adding reminders, not blocking
exit 0
