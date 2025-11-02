# hooks/before_merge.sh
#!/usr/bin/env bash
set -euo pipefail
echo "[before_merge] Running integration/E2E/Lighthouse..."

# E2E tests with Playwright
if [ -f "playwright.config.ts" ] || [ -f "playwright.config.js" ]; then
  echo "→ Running Playwright E2E tests..."
  npx playwright test --reporter=list || {
    echo "❌ Playwright tests failed. Please fix failing E2E tests before merging."
    exit 1
  }

  # Generate HTML report for review
  echo "→ Generating Playwright test report..."
  npx playwright show-report --host 127.0.0.1 &
  echo "   Report available at: http://127.0.0.1:9323"
else
  echo "⚠️  Playwright not configured. Skipping E2E tests."
  echo "   Setup: npm init playwright@latest"
fi

# Lighthouse CI for performance/accessibility/SEO checks
if [ -f "lighthouserc.json" ] || [ -f ".lighthouserc.json" ]; then
  echo "→ Running Lighthouse CI..."

  # Start dev server in background if needed
  if command -v lhci &> /dev/null; then
    lhci autorun || {
      echo "❌ Lighthouse CI failed. Performance/accessibility/SEO checks did not meet thresholds."
      exit 1
    }
  else
    echo "⚠️  Lighthouse CI not installed. Skipping performance checks."
    echo "   Install: npm install -g @lhci/cli"
  fi
else
  echo "⚠️  Lighthouse CI not configured. Skipping performance/accessibility/SEO checks."
  echo "   Setup: Create lighthouserc.json with your configuration"
fi

# Optional: Visual regression testing with Percy or similar
if [ -n "${PERCY_TOKEN:-}" ]; then
  echo "→ Running visual regression tests..."
  npx percy exec -- npx playwright test || {
    echo "❌ Visual regression tests failed."
    exit 1
  }
else
  echo "ℹ️  Percy not configured. Skipping visual regression tests."
fi

# Voice notification (Eden announces integration tests completion)
VOICE_SCRIPT="$(dirname "$0")/../mcp-servers/play-voice.sh"
if [ -f "$VOICE_SCRIPT" ]; then
  "$VOICE_SCRIPT" "eden" "integration tests" 2>/dev/null || true
fi

echo "✅ All pre-merge checks passed!"

# Auto-commit integration test results (Eden)
AUTO_COMMIT_SCRIPT="$(dirname "$0")/../mcp-servers/auto-commit.sh"
if [ -f "$AUTO_COMMIT_SCRIPT" ] && [ -x "$AUTO_COMMIT_SCRIPT" ]; then
  "$AUTO_COMMIT_SCRIPT" \
    "test" \
    "to validate integration quality" \
    "Pass integration tests (E2E, Lighthouse CI, visual regression)" \
    "Eden" 2>/dev/null || true
fi