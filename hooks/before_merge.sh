# hooks/before_merge.sh
#!/usr/bin/env bash
set -euo pipefail

# Get language setting from environment
LANG="${ORCHESTRA_LANGUAGE:-en}"

if [ "$LANG" = "ja" ]; then
  echo "[before_merge] 統合/E2E/Lighthouse実行中..."
else
  echo "[before_merge] Running integration/E2E/Lighthouse..."
fi

# E2E tests with Playwright
if [ -f "playwright.config.ts" ] || [ -f "playwright.config.js" ]; then
  if [ "$LANG" = "ja" ]; then
    echo "→ Playwright E2Eテスト実行中..."
  else
    echo "→ Running Playwright E2E tests..."
  fi

  npx playwright test --reporter=list || {
    if [ "$LANG" = "ja" ]; then
      echo "❌ Playwrightテストが失敗しました。マージ前に失敗したE2Eテストを修正してください。"
    else
      echo "❌ Playwright tests failed. Please fix failing E2E tests before merging."
    fi
    exit 1
  }

  # Generate HTML report for review
  if [ "$LANG" = "ja" ]; then
    echo "→ Playwrightテストレポート生成中..."
  else
    echo "→ Generating Playwright test report..."
  fi

  npx playwright show-report --host 127.0.0.1 &

  if [ "$LANG" = "ja" ]; then
    echo "   レポート閲覧URL：http://127.0.0.1:9323"
  else
    echo "   Report available at: http://127.0.0.1:9323"
  fi
else
  if [ "$LANG" = "ja" ]; then
    echo "⚠️  Playwrightが設定されていません。E2Eテストをスキップします。"
    echo "   セットアップ：npm init playwright@latest"
  else
    echo "⚠️  Playwright not configured. Skipping E2E tests."
    echo "   Setup: npm init playwright@latest"
  fi
fi

# Lighthouse CI for performance/accessibility/SEO checks
if [ -f "lighthouserc.json" ] || [ -f ".lighthouserc.json" ]; then
  if [ "$LANG" = "ja" ]; then
    echo "→ Lighthouse CI実行中..."
  else
    echo "→ Running Lighthouse CI..."
  fi

  # Start dev server in background if needed
  if command -v lhci &> /dev/null; then
    lhci autorun || {
      if [ "$LANG" = "ja" ]; then
        echo "❌ Lighthouse CIが失敗しました。パフォーマンス/アクセシビリティ/SEOチェックが基準を満たしていません。"
      else
        echo "❌ Lighthouse CI failed. Performance/accessibility/SEO checks did not meet thresholds."
      fi
      exit 1
    }
  else
    if [ "$LANG" = "ja" ]; then
      echo "⚠️  Lighthouse CIがインストールされていません。パフォーマンスチェックをスキップします。"
      echo "   インストール：npm install -g @lhci/cli"
    else
      echo "⚠️  Lighthouse CI not installed. Skipping performance checks."
      echo "   Install: npm install -g @lhci/cli"
    fi
  fi
else
  if [ "$LANG" = "ja" ]; then
    echo "⚠️  Lighthouse CIが設定されていません。パフォーマンス/アクセシビリティ/SEOチェックをスキップします。"
    echo "   セットアップ：lighthouserc.jsonを作成してください"
  else
    echo "⚠️  Lighthouse CI not configured. Skipping performance/accessibility/SEO checks."
    echo "   Setup: Create lighthouserc.json with your configuration"
  fi
fi

# Optional: Visual regression testing with Percy or similar
if [ -n "${PERCY_TOKEN:-}" ]; then
  if [ "$LANG" = "ja" ]; then
    echo "→ ビジュアルリグレッションテスト実行中..."
  else
    echo "→ Running visual regression tests..."
  fi

  npx percy exec -- npx playwright test || {
    if [ "$LANG" = "ja" ]; then
      echo "❌ ビジュアルリグレッションテストが失敗しました。"
    else
      echo "❌ Visual regression tests failed."
    fi
    exit 1
  }
else
  if [ "$LANG" = "ja" ]; then
    echo "ℹ️  Percyが設定されていません。ビジュアルリグレッションテストをスキップします。"
  else
    echo "ℹ️  Percy not configured. Skipping visual regression tests."
  fi
fi

# Voice notification (Eden announces integration tests completion)
VOICE_SCRIPT="$(dirname "$0")/../mcp-servers/play-voice.sh"
if [ -f "$VOICE_SCRIPT" ]; then
  "$VOICE_SCRIPT" "eden" "integration tests" 2>/dev/null || true
fi

if [ "$LANG" = "ja" ]; then
  echo "✅ 全てのマージ前チェックが通過しました！"
else
  echo "✅ All pre-merge checks passed!"
fi

# Auto-commit integration test results (Eden)
AUTO_COMMIT_SCRIPT="$(dirname "$0")/../mcp-servers/auto-commit.sh"
if [ -f "$AUTO_COMMIT_SCRIPT" ] && [ -x "$AUTO_COMMIT_SCRIPT" ]; then
  "$AUTO_COMMIT_SCRIPT" \
    "test" \
    "to validate integration quality" \
    "Pass integration tests (E2E, Lighthouse CI, visual regression)" \
    "Eden" 2>/dev/null || true
fi
