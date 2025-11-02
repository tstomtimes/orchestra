#!/usr/bin/env bash
# Agent Auto-Routing Reminder Hook
# Analyzes user prompts and injects routing reminders for specialized agents
#
# This hook enables automatic agent invocation by detecting keywords
# and triggering appropriate specialist agents

set -euo pipefail

# Get user prompt from environment (passed by Claude Code)
USER_PROMPT="${USER_PROMPT:-}"

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
if echo "$PROMPT_LOWER" | grep -qE "(add new|build new|implement new|create new|新しい.*追加|新規.*作成)"; then
    if echo "$PROMPT_LOWER" | grep -qE "(system|feature|authentication|auth|認証|payment|決済|api)"; then
        MATCHED_AGENTS+=("Alex")
        AGENT_MATCHED=true
    fi
fi

# Authentication specifically triggers Alex + Iris
if echo "$PROMPT_LOWER" | grep -qE "(authentication|auth|login|認証|ログイン|oauth|jwt|session)"; then
    if ! [[ " ${MATCHED_AGENTS[@]} " =~ " Alex " ]]; then
        MATCHED_AGENTS+=("Alex")
        AGENT_MATCHED=true
    fi
fi

# --- Priority 3: UI/UX → Nova ---
if echo "$PROMPT_LOWER" | grep -qE "(ui|dashboard|ダッシュボード|component|コンポーネント|form|フォーム|design|デザイン|layout|responsive|accessibility|a11y|lighthouse)"; then
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

# If any agents matched, output routing reminder
if [ "$AGENT_MATCHED" = true ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🎭 AGENT AUTO-ROUTING REMINDER"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "⚠️  CRITICAL: Detected specialized domain in user request."
    echo ""
    echo "📋 Matched Agents: ${MATCHED_AGENTS[*]}"
    echo ""
    echo "🚨 MANDATORY ACTION REQUIRED:"
    echo ""

    # Provide specific routing instructions based on matched agents
    for agent in "${MATCHED_AGENTS[@]}"; do
        case $agent in
            "Riley")
                echo "   • Riley (Clarifier): User request contains ambiguous/subjective language"
                echo "     → IMMEDIATELY invoke: orchestra:😤 Riley"
                echo "     → Reason: Terms like 'fast', 'slow', 'better' require specific criteria"
                echo ""
                ;;
            "Alex")
                echo "   • Alex (Project Conductor): Major feature addition detected"
                echo "     → IMMEDIATELY invoke: orchestra:🙂 Alex"
                echo "     → Reason: New systems need scope definition and coordination"
                echo ""
                ;;
            "Nova")
                echo "   • Nova (UI/UX Specialist): User interface work detected"
                echo "     → IMMEDIATELY invoke: orchestra:😄 Nova"
                echo "     → Reason: UI/UX requires accessibility, performance, and design expertise"
                echo ""
                ;;
            "Leo")
                echo "   • Leo (Database Architect): Database schema work detected"
                echo "     → IMMEDIATELY invoke: orchestra:😌 Leo"
                echo "     → Reason: Schema changes need proper design, migrations, and RLS policies"
                echo ""
                ;;
            "Mina")
                echo "   • Mina (Integration Specialist): External service integration detected"
                echo "     → IMMEDIATELY invoke: orchestra:😊 Mina"
                echo "     → Reason: Integrations require secure config and error handling"
                echo ""
                ;;
            "Kai")
                echo "   • Kai (System Architect): Architectural decision detected"
                echo "     → IMMEDIATELY invoke: orchestra:🤔 Kai"
                echo "     → Reason: Architecture changes need design review and ADR documentation"
                echo ""
                ;;
            "Iris")
                echo "   • Iris (Security Auditor): Security-critical work detected"
                echo "     → IMMEDIATELY invoke: orchestra:🤨 Iris"
                echo "     → Reason: Security requires audit for vulnerabilities and secret handling"
                echo ""
                ;;
        esac
    done

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "❌ DO NOT:"
    echo "   - Use AskUserQuestion without checking routing rules"
    echo "   - Start exploring codebase yourself"
    echo "   - Create TodoWrite and handle it yourself"
    echo ""
    echo "✅ DO THIS INSTEAD:"
    echo "   1. Use the Task tool to invoke the appropriate agent(s)"
    echo "   2. Let the specialist agent handle the work"
    echo "   3. Review their output and coordinate next steps"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
fi

# Always approve (exit 0) - we're just adding reminders, not blocking
exit 0
