# hooks/before_pr.sh
#!/usr/bin/env bash
set -euo pipefail
echo "[before_pr] Running lint/type/tests/secret/sbom..."

# Detect project type and run appropriate checks
if [ -f "package.json" ]; then
  echo "→ Running ESLint..."
  npx eslint . --ext .js,.jsx,.ts,.tsx --max-warnings 0 || {
    echo "❌ ESLint failed. Please fix linting errors before creating PR."
    exit 1
  }

  echo "→ Running TypeScript compiler..."
  npx tsc --noEmit || {
    echo "❌ TypeScript compilation failed. Please fix type errors before creating PR."
    exit 1
  }

  echo "→ Running tests..."
  npm test -- --passWithNoTests || {
    echo "❌ Tests failed. Please ensure all tests pass before creating PR."
    exit 1
  }
fi

if [ -f "pytest.ini" ] || [ -f "setup.py" ] || [ -f "pyproject.toml" ]; then
  echo "→ Running pytest..."
  pytest --maxfail=1 --disable-warnings -q || {
    echo "❌ Pytest failed. Please fix failing tests before creating PR."
    exit 1
  }
fi

# Secret scanning with TruffleHog
if command -v trufflehog &> /dev/null; then
  echo "→ Running TruffleHog secret scan..."
  trufflehog git file://. --since-commit HEAD~1 --only-verified --fail || {
    echo "❌ Secret detected! Please remove secrets before creating PR."
    exit 1
  }
else
  echo "⚠️  TruffleHog not installed. Skipping secret scan. Install: brew install trufflehog"
fi

# SBOM generation and vulnerability scanning with Syft + Grype
if command -v syft &> /dev/null && command -v grype &> /dev/null; then
  echo "→ Generating SBOM with Syft..."
  syft dir:. -o cyclonedx-json > sbom.json

  echo "→ Scanning vulnerabilities with Grype..."
  grype sbom:sbom.json --fail-on medium || {
    echo "❌ Vulnerabilities detected! Please address security issues before creating PR."
    exit 1
  }
else
  echo "⚠️  Syft/Grype not installed. Skipping SBOM & vulnerability scan."
  echo "   Install: brew install syft grype"
fi

# Voice notification (Eden announces QA completion)
VOICE_SCRIPT="$(dirname "$0")/../mcp-servers/play-voice.sh"
if [ -f "$VOICE_SCRIPT" ]; then
  "$VOICE_SCRIPT" "eden" "pre-PR checks" 2>/dev/null || true
fi

echo "✅ All pre-PR checks passed!"

# Auto-commit QA validation results (Eden)
AUTO_COMMIT_SCRIPT="$(dirname "$0")/../mcp-servers/auto-commit.sh"
if [ -f "$AUTO_COMMIT_SCRIPT" ] && [ -x "$AUTO_COMMIT_SCRIPT" ]; then
  "$AUTO_COMMIT_SCRIPT" \
    "test" \
    "to ensure code quality" \
    "Pass pre-PR quality checks (lint, type, test, secrets, vulnerabilities)" \
    "Eden" 2>/dev/null || true
fi